# OnlyLinks — Points & Cosmetic Rewards: Design Spec

**Status:** Draft for approval · **Date:** 2026-06-14
**Decisions locked in:** earning = daily login/streak + managing links + page engagement + referrals; redemption = random loot-box; item types = page themes/colors, button styles/effects, avatar frames/badges, animated backgrounds.

---

## 1. Goal & principles

Reward ongoing use of OnlyLinks with **points**, which are spent on a **random unlock ("loot-box")** to collect **cosmetic items** that decorate the user's public page.

Non-negotiable principles:

1. **Server-authoritative economy.** The browser never writes points, balances, or inventory. Every award and every spend happens in a trusted server context (Postgres `SECURITY DEFINER` functions and/or server actions). RLS denies all client writes to economy tables. A points system that the client can edit is worthless.
2. **Cosmetics are app-authored, not user-authored.** Item visuals live in a typed registry in code (`src/lib/cosmetics.ts`, mirroring the existing `themes.ts`/`socials.ts` pattern). The DB only tracks *which* items a user owns/equips — never raw CSS from users. This keeps the loot economy and the XSS surface clean.
3. **Defense-in-depth on render.** Cosmetic CSS still flows through the existing `neutralizeStyleBreakout` + `sanitizeCssValue` pipeline on the public page, even though it is app-authored.
4. **Anti-abuse first.** Engagement and referral points are the obvious farm targets; both are awarded server-side with dedupe + caps (details in §5).
5. **Earned-only points.** Points are never purchasable with money. This keeps the loot-box clear of real-money-gambling concerns. (If that ever changes, revisit legality.)
6. **Points have a second sink: unlocking paid links** (at a *large* points cost). This must never silently cost a creator their revenue — so it is **opt-in per link** by the link owner. Default off; existing paywalls are untouched (see §5.6).

---

## 2. Data model

All new tables have RLS enabled. "No client write" means: no `insert/update/delete` policy for `anon`/`authenticated`; writes happen only through `SECURITY DEFINER` functions or the service-role path.

### 2.1 `profiles` — new columns (cached/scalar state)

| column | type | notes |
|---|---|---|
| `points_balance` | `int not null default 0` | Cached sum of the ledger; updated only by economy functions. Client read-only. |
| `login_streak` | `int not null default 0` | Consecutive days. |
| `last_login_award_on` | `date` | Guards one login award per day. |
| `equipped_theme_id` | `text` | FK-by-convention to a cosmetic id; null = use built-in theme/custom-design. |
| `equipped_button_id` | `text` | |
| `equipped_frame_id` | `text` | |
| `equipped_background_id` | `text` | |
| `equipped_badge_id` | `text` | |
| `referral_code` | `text unique` | Short code generated on profile creation. |

Equipping is validated server-side (must own the cosmetic); RLS keeps these columns updatable only via the equip server action's path.

### 2.2 `point_events` — append-only ledger (source of truth)

| column | type |
|---|---|
| `id` | `uuid pk` |
| `profile_id` | `uuid fk profiles` |
| `amount` | `int` (positive = earn, negative = spend) |
| `reason` | `text` enum: `daily_login`,`streak_bonus`,`link_added`,`profile_complete`,`engagement`,`referral`,`loot_box`,`admin_adjust` |
| `metadata` | `jsonb` (e.g. `{link_id}`, `{cosmetic_id}`, `{day}`) |
| `created_at` | `timestamptz default now()` |

RLS: **owner can SELECT** (so they see history); **no client INSERT/UPDATE/DELETE**. Balance is `profiles.points_balance`, kept in sync by the functions that write events.

### 2.3 `cosmetics` — catalog (mirrors the code registry)

| column | type |
|---|---|
| `id` | `text pk` (slug, e.g. `bg_aurora`) |
| `type` | `text` enum: `theme`,`button`,`frame`,`background`,`badge` |
| `name` | `text` |
| `rarity` | `text` enum: `common`,`rare`,`epic`,`legendary` |
| `active` | `bool default true` (lets us retire items without breaking inventories) |

RLS: **public SELECT**, no client write. Seeded by migration; the **visual definition lives in `src/lib/cosmetics.ts`**, this table just enables ownership + drop-pool queries.

### 2.4 `user_cosmetics` — inventory

`id, profile_id, cosmetic_id, source ('loot_box'|'grant'), acquired_at`, `unique(profile_id, cosmetic_id)`.
RLS: **owner SELECT**; **no client INSERT** (only the `redeem_loot_box` function inserts).

### 2.5 `referrals`

`id, referrer_id, referred_id (unique), code, qualified bool default false, rewarded bool default false, created_at`.
RLS: owner (referrer) SELECT; no client write (created/updated by server actions + qualification job).

### 2.6 Engagement bookkeeping

Add `last_engagement_award_at timestamptz` to `profiles` (or a small `engagement_awards(profile_id, day, points)` table for daily caps). Engagement points are computed from existing `click_events` / `page_views` (see §5.3), never written by the client.

### 2.7 `link_unlocks` — changes for points-redeemed unlocks

The existing table records Stripe-paid unlocks keyed by `stripe_session_id (not null unique)` and an anonymous `visitor_id`. To support points unlocks by a logged-in user:

- make `stripe_session_id` **nullable** (points unlocks have none);
- add `profile_id uuid` (the redeeming user) and `redeemed_with text` (`'stripe'|'points'`);
- add a uniqueness guard so a user can't double-unlock the same link with points: `unique(link_id, profile_id) where redeemed_with = 'points'`.

Add `accepts_points boolean not null default false` to `links` — the owner's opt-in for whether a locked link may be unlocked with points.

RLS unchanged in spirit: inserts only via the server (`redeem_link_with_points` function); owners read their own unlock records.

---

## 3. Cosmetics registry (code)

`src/lib/cosmetics.ts` — the typed source of truth for *how each item looks*, following `themes.ts`:

```ts
type CosmeticType = "theme" | "button" | "frame" | "background" | "badge";
type Rarity = "common" | "rare" | "epic" | "legendary";

type Cosmetic = {
  id: string;
  type: CosmeticType;
  name: string;
  rarity: Rarity;
  // render(): returns scoped CSS and/or a small render descriptor.
  // App-authored only — no user input ever reaches this.
};
```

Rendering integration on the public page (the file we hardened, `src/app/[handle]/page.tsx`):

- **theme / button / background** → contribute CSS appended into the existing inline `<style>` block, *after* theme + custom-design, so equipped cosmetics win. Still wrapped by `neutralizeStyleBreakout`.
- **frame / badge** → small DOM elements around the avatar / under the name (not CSS injection).
- Precedence: built-in theme → user custom-design → equipped cosmetics (cosmetics layer on top).

---

## 4. Points economy (tunable starting values)

| Action | Award | Guardrail |
|---|---|---|
| Daily login | +10 | once per calendar day (`last_login_award_on`) |
| Login streak bonus | +5 × streak | capped at +50; resets if a day is missed |
| Add a link | +15 | capped at 5 awarded links/day; only on real new links |
| Profile completion | +50 | one-time (avatar + bio + ≥3 links) |
| Page engagement | +1 per unique visitor interaction | capped +50/day, dedup by `visitor_id`, owner self-views excluded |
| Referral | +200 | once per referred account, only after it *qualifies* (§5.4) |

**Loot-box:** cost **100 points**. Rarity weights: common 60% / rare 27% / epic 10% / legendary 3% (Pro adds the **exclusive** tier, below).
**No duplicates (locked in):** roll only from items the user does **not** own in the chosen rarity; if that rarity pool is exhausted, fall back to the next rarity; if the user owns *everything* available to them, the spend is blocked with "You've collected everything!" and **no points are lost**.

**Pro perks (locked in):**
- **Earn multiplier ×1.5** on every earning source (applied server-side via `isPro`).
- **Exclusive rarity** (`exclusive`, ~2% weight) whose items only drop for Pro users; non-Pro can never roll them. If a user's Pro lapses they keep already-owned exclusives but stop earning the multiplier and stop rolling new exclusives.

**Spend points to unlock a paid link:** cost is deliberately **large** and scales with the link's price — proposed `max(1000, price_cents × 5)` points (i.e., a $5 link ≈ 2,500 pts). Only available on links whose owner opted in (§5.6). Tunable.

All numbers live in one config module so they're trivially tunable.

---

## 5. Earning logic & anti-abuse (the important part)

### 5.1 Daily login + streak
On dashboard load (or first authenticated request of the day), a server action calls `award_daily_login(profile)`: if `last_login_award_on < today`, award +10, update streak (consecutive if yesterday, else reset to 1), award streak bonus, set `last_login_award_on = today`. Idempotent per day.

### 5.2 Managing links
Hook into the existing `addLink` server action: award +15 via `award_points(profile, 'link_added', {link_id})` subject to the daily cap. Profile-completion check runs after profile/link mutations and awards its one-time bonus.

### 5.3 Page engagement (highest abuse risk)
**Never** award on the public page render (attacker could self-refresh). Instead, a **reconciliation pass** sums *new* unique-visitor `click_events`+`page_views` since `last_engagement_award_at`, **excluding the owner's own `visitor_id`**, awards +1 each up to +50/day, and advances the watermark. Dedup by `visitor_id` prevents refresh farming; the daily cap bounds damage. **Timing (my call, your deferral):** for v1 run this **lazily on dashboard load** — no extra infrastructure, and the owner is the only one who needs fresh numbers. Promote to **Supabase `pg_cron`** later if it must run independent of visits (same function, just scheduled). Caps make timing non-exploitable either way.

### 5.4 Referrals
`referral_code` per profile → shareable `/signup?ref=CODE`. On signup, record a `referrals` row (reject self-referral, one per referred account). The referrer is paid **only when the referred account qualifies** — qualification = confirmed email **and** added ≥1 link — checked by a server job, which sets `qualified` then `rewarded` and awards +200 once. This blocks throwaway-account farming.

### 5.5 Loot-box (atomic spend)
`redeem_loot_box(profile)` as a single `SECURITY DEFINER` transaction:
1. lock the profile row; verify `points_balance >= 100`.
2. pick rarity by weighted random (server-side `random()`), then a random **unowned** active cosmetic of that rarity (fallback rules per §4).
3. insert `user_cosmetics`, insert a `point_events` `-100` row, decrement `points_balance`.
4. return the won cosmetic.
All-or-nothing → no double-spend / race exploits.

### 5.6 Spend points to unlock a paid link
Lets a **logged-in** user spend a large amount of points instead of paying cash, **only** on links where the owner set `accepts_points = true`.

`redeem_link_with_points(profile, link)` — one `SECURITY DEFINER` transaction:
1. verify the link is locked **and** `accepts_points`; verify it isn't already unlocked by this user.
2. compute cost = `max(1000, price_cents × 5)`; verify `points_balance >= cost`.
3. insert `link_unlocks` (`profile_id`, `redeemed_with='points'`, `stripe_session_id=null`), write a `point_events` `-cost` row, decrement balance.
4. return the destination URL.

The unlock page (`/unlock/[linkId]`) gains a second option for logged-in users when `accepts_points`: "Unlock with N points" alongside the Stripe button. Lookup of "already unlocked" must also check `link_unlocks` by `profile_id` (today it only knows Stripe/anon visitor unlocks).

**Creator-revenue note (important):** a points unlock pays the creator **nothing in cash** — the creator opted in (trading some reach/goodwill, not a sale). Default off keeps every existing paywall a pure cash sale. The alternative (platform funds a cash bounty to the creator per points-unlock) is a real cost to OnlyLinks and is deferred — see §8.

---

## 6. UX

**Dashboard → new "Rewards" card:**
- Points balance + how-to-earn legend; current streak.
- "Open box — 100 pts" button → reveal animation showing the won item + rarity.
- Inventory grid grouped by type; each owned item has **Equip/Unequip**; locked items shown as silhouettes with rarity.
- Referral link with copy button + simple referred/qualified counts.

**Public page:** equipped cosmetics render automatically (§3). Optional tiny "badge" by the name.

All economy actions are server actions; the client only triggers them and renders results.

---

## 7. Delivery phases (PR-sized, TDD per CLAUDE.md)

1. **Schema + RLS + seed.** Migration for all tables/columns, RLS policies (deny client economy writes), `cosmetics` seed, `src/lib/cosmetics.ts` registry. Tests for RLS (client write attempts must fail).
2. **Core points service.** `award_points` / balance sync + ledger; daily-login + streak; link-added + profile-complete. Tests for caps/idempotency.
3. **Engagement reconciliation** with dedupe + daily cap (+ self-view exclusion). Tests with synthetic click data.
4. **Referrals** (code, signup capture, qualification job, reward-once). Tests for self-referral & double-reward prevention.
5. **Loot-box** `redeem_loot_box` function (atomic, weighted, unowned-only, Pro exclusive tier) + Rewards UI + reveal. Tests for insufficient-balance, no-dupe, exhausted pool, Pro-only drops.
6. **Points-redeemed link unlocks** — `link_unlocks` schema change (nullable `stripe_session_id`, add `profile_id` + `redeemed_with`), `links.accepts_points` opt-in toggle, `redeem_link_with_points` atomic function, "Unlock with points" path on the unlock page. Tests for balance / opt-in / double-unlock / not-logged-in enforcement.
7. **Cosmetic rendering + equip** on public page (CSS layering through the hardened `<style>`, frames/badges as DOM). Equip validates ownership.
8. **Polish + anti-abuse review + animations.**

---

## 8. Decisions & remaining questions

**Resolved (2026-06-14):**
- **No duplicates** — block the spend with no loss when everything in-rarity is owned. ✅
- **Pro perks** — ×1.5 earn multiplier + exclusive rarity tier. ✅
- **Points → link unlock** — added, opt-in per link, large cost. ✅
- **Engagement timing** — lazy reconciliation on dashboard load for v1; `pg_cron` later. ✅ (my call)

**Still open:**
1. **Creator payout for points-unlocks (most important):** default is the creator gets **no cash** and simply opts in. Acceptable, or do you want the platform to pay creators a cash bounty when someone unlocks with points (a real cost to OnlyLinks, deferred)? This is a business-model call.
2. **Point expiry:** never expire, or expire after long inactivity (e.g., 12 months)?
3. **Starting economy values** in §4 (award sizes, 100-pt box, unlock cost formula) — keep for v1 or tweak?
4. **v1 cosmetics catalog size:** how many items per type/rarity in the initial seed? (Drives how grindy/rewarding it feels.)
