# Private Access Links

Turn a locked link into a **unique, anonymous, non-shareable access grant** so the paywall cannot be bypassed by copying the destination URL.

## Problem

Today, a paid unlock is tied to a coarse `visitor_id` hash (`SHA-256(ip|ua)[0:16]`). After payment:

1. `/api/stripe/verify` and `/api/stripe/unlock-status` return the **raw destination URL** in JSON.
2. The unlock page sends the browser directly to that URL (`router.replace(url)`).
3. `/l/[linkId]` eventually 307-redirects to the destination, which appears in the browser address bar.

That means anyone who obtains the destination URL once can share it and bypass payment. The current model is a **pay-to-reveal**, not a **pay-to-access**.

OnlyFans works because content stays on their platform behind session/auth. OnlyLinks stores **external URLs**, so we cannot fully hide the destination forever — but we can stop leaking it in APIs, bind access to a per-purchase secret, and make sharing impractical for normal users.

## Goal

For locked links, access should be:

- **Unique** — each successful payment creates its own access grant.
- **Anonymous** — no account required; buyer stays anonymous to the creator.
- **Non-duplicatable** — sharing the profile link or paywall page must not grant free access.
- **Durable for the buyer** — same browser/device keeps access via HttpOnly cookie after payment.
- **Revocable server-side** — creator/platform can invalidate grants if needed.

## Non-goals (v1)

- Proxying arbitrary external sites inside OnlyLinks (expensive, brittle, breaks many destinations).
- Perfect DRM — a determined buyer can still screenshot or copy a destination after redirect.
- Device fingerprinting beyond a signed cookie + optional visitor match.

## Current flow (broken for sharing)

```
Profile locked link → /unlock/{linkId}
  → pay on Stripe
  → verify returns { url: "https://secret.com" }
  → browser goes to secret.com  ← shareable forever
```

## Proposed model: Private Access Grant (PAG)

Each successful Stripe payment creates a row in `link_unlocks` with a **random access token**. The destination URL never leaves server-side redirect logic.

### Schema (additive migration)

```sql
alter table public.link_unlocks
  add column if not exists access_token text not null default encode(gen_random_bytes(32), 'hex'),
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz;

create unique index if not exists link_unlocks_access_token_idx
  on public.link_unlocks (access_token);
```

Keep `stripe_session_id` as the idempotency key for webhook/verify dedupe.

### Cookie

After a valid token is redeemed once, set:

```
Set-Cookie: ol_access_{linkId}={access_token}; HttpOnly; Secure; SameSite=Lax; Path=/l/{linkId}; Max-Age=31536000
```

Subsequent visits to `/l/{linkId}` check the cookie before falling back to paywall.

### Access check order in `/l/[linkId]`

1. Link not locked → redirect + log click (unchanged).
2. Valid `?t=` token in query **or** matching HttpOnly cookie → grant access.
3. Legacy fallback: `has_link_unlock(visitor_id)` for existing rows (migration period only).
4. Otherwise → redirect to `/unlock/{linkId}`.

### Stop leaking destination URLs

| Endpoint | Today | Change |
|---|---|---|
| `GET /api/stripe/verify` | `{ url }` | `{ redirectTo: "/l/{linkId}?t={token}" }` + set cookie |
| `GET /api/stripe/unlock-status` | `{ unlocked, url }` | `{ unlocked: true }` only; client navigates to `/l/{linkId}` |
| `unlock-inner.tsx` | `router.replace(url)` | `router.replace("/l/{linkId}?t=...")` or cookie-only `/l/{linkId}` |
| `GET /l/[linkId]` | 307 to destination if `visitor_id` match | 307 only if token/cookie valid |

The destination URL should **only** appear in the server `Location` header of the final redirect, never in JSON/HTML source before payment.

## End-to-end flow (target)

```
Visitor clicks locked link on profile
  → /unlock/{linkId}
  → Stripe Checkout
  → webhook + verify upsert link_unlocks(access_token, expires_at)
  → browser sent to /l/{linkId}?t={access_token}   ← password-manager-style temp handoff
  → server validates token, burns handoff, sets HttpOnly cookie, 307 to destination
  → repeat visits: /l/{linkId} with cookie, no re-pay

Someone else opens /unlock/{linkId}, /l/{linkId}, or an expired ?t= link
  → paywall again
```

### Password-manager-style handoff (implemented in Slice 1)

Like 1Password / Bitwarden Send links:

- Each payment gets a **unique token**
- The `?t=` handoff link **expires after 30 minutes**
- The handoff token is **single-use** (`redeemed_at` set on first `/l` hit)
- After redemption, access continues via an **HttpOnly cookie** on that device for up to 1 year
- The destination URL is never returned in JSON APIs

## Why this is much harder to share

- Sharing `onlylinks.com/unlock/{linkId}` does **not** include access — still requires payment.
- Sharing `onlylinks.com/l/{linkId}` does **not** include access — no cookie on their device.
- Sharing `onlylinks.com/l/{linkId}?t=...` could work **once** if we keep tokens reusable; optional v2: mark `redeemed_at` and require cookie after first use.
- Sharing the destination URL after redirect is still possible (unavoidable with external URLs) but requires having paid first and manually copying — not automatic from the product UI.

## Implementation slices (TDD)

### Slice 1 — Access token foundation (smallest useful change)

- Migration: `access_token`, `expires_at`, `revoked_at`.
- `lib/access-grants.ts`: `createAccessGrant`, `isAccessGranted({ linkId, token, cookie })`.
- Update webhook + verify to generate/use tokens.
- Update `/l/[linkId]` to accept `?t=` + cookie.
- Update verify/unlock-status/unlock page to stop returning raw URLs.
- Tests: token validation, cookie path, no URL in verify response shape.

### Slice 2 — One-time token handoff

- On first successful `/l/{linkId}?t=...`, set cookie and optionally mark token as consumed for query-string reuse.
- Prevents token link forwarding in chat apps.

### Slice 3 — Creator controls

- Dashboard: view unlock count, revoke access for a link or single grant.
- Optional expiry per link (`access_ttl_hours` on `links`).

### Slice 4 — Hardening

- Rate-limit `/l/[linkId]` and `/api/stripe/unlock-status`.
- Remove legacy `visitor_id`-only access after migration window.
- Signed short-lived redirect JWT if we need mobile handoff without long-lived query tokens.

## Open decisions

1. **Token reuse** — Should `?t=` work forever, or only once before cookie is set? Recommend: once for query param, then cookie only.
2. **Access duration** — Forever vs 30/90 days? Recommend: 1 year cookie, refresh on use.
3. **Multiple purchases** — Same buyer pays twice → two grants or refresh existing? Recommend: upsert by `stripe_session_id` keeps one grant per payment; cookie uses latest valid grant.
4. **Public profile link shape** — Keep `/unlock/{linkId}` for locked links (good — no destination leak). No change needed.

## Acceptance criteria

- [ ] Free user cannot obtain destination URL from any API response before paying.
- [ ] After paying, same browser can revisit `/l/{linkId}` without paying again (cookie).
- [ ] Different browser/device without token/cookie is sent to paywall.
- [ ] Each Stripe payment creates a distinct `access_token` row.
- [ ] Existing unlock records backfilled with generated tokens on migration.
- [ ] Tests cover grant creation, validation, cookie redemption, and API response shapes.
