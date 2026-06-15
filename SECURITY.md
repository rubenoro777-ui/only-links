# Security

## What is safe in GitHub

| Safe to commit | Never commit |
|----------------|--------------|
| `.env.example` (empty placeholders) | `.env.local` |
| Source code using `process.env.*` | Stripe keys (`sk_test_`, `sk_live_`) |
| Supabase migrations | Webhook secrets (`whsec_`) |
| Public `NEXT_PUBLIC_*` var **names** in docs | Supabase service role key |
| | Supabase access tokens (`sbp_`) |

`.env.local`, `.vercel/`, and `vercel-env-*.txt` are gitignored.

## Where secrets live

- **Local dev:** `.env.local` (copy from `.env.example`)
- **Production:** [Vercel → Project Settings → Environment Variables](https://vercel.com/dashboard)

Never paste real keys into source files, README, or chat logs.

## Before every push

```bash
pnpm check-secrets
```

GitHub Actions also runs [Gitleaks](https://github.com/gitleaks/gitleaks) on push and pull requests.

## If a secret was exposed

1. **Rotate immediately** in Stripe / Supabase dashboards
2. Update `.env.local` and Vercel env vars
3. If it was committed to git, use [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) guidance or rewrite history — rotating the key is still required

## Public vs server-only env vars

- `NEXT_PUBLIC_*` — bundled into the browser; safe only for anon Supabase key + site URL
- Everything else (Stripe, service role, webhooks) — server-only, no `NEXT_PUBLIC_` prefix
