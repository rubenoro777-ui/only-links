# OnlyLinks

A multi-user link-in-bio platform (Linktree-style). Anyone signs up, claims a
handle, and gets a fast public page at `/<handle>` listing their links. Built
with Next.js 15 (App Router), Supabase (Auth + Postgres + RLS + Storage),
Tailwind CSS, and shadcn/ui.

> **v1 scope:** the full multi-tenant link platform — auth, handle claiming,
> profile + link management with drag-to-reorder, a server-rendered public
> page, and click/view analytics. The schema includes `is_locked` and
> `price_cents` columns as hooks for **v2** paid link unlocks, but no payment
> code ships in v1.

---

## Tech stack

- **Next.js 15+** — App Router, TypeScript (strict), Server Components by default
- **Supabase** — Auth (email + Google OAuth), Postgres with Row-Level Security, Storage for avatars
- **Tailwind CSS + shadcn/ui** — styling and UI primitives
- **Zod** — server-side validation of all user input
- **react-hook-form** — client forms
- **@dnd-kit** — drag-and-drop link reordering
- **pnpm** — package manager
- **Vercel** — deploy target

---

## Prerequisites

- Node.js 18.18+ (20+ recommended)
- pnpm (`npm install -g pnpm`)
- A free [Supabase](https://supabase.com) account
- A Google Cloud account (only if you want Google OAuth)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com/dashboard> and create a new project.
2. Pick a strong database password and a region close to your users.
3. Wait for the project to finish provisioning.

### 3. Apply the database schema

Open **SQL Editor** in your Supabase dashboard, paste the entire contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and
click **Run**. This creates all four tables, indexes, Row-Level Security
policies, and the public `avatars` storage bucket.

> Prefer the CLI? With the [Supabase CLI](https://supabase.com/docs/guides/cli)
> installed and the project linked, run `supabase db push`.

### 4. Configure environment variables

Copy the example file and fill in your project's values:

```bash
cp .env.example .env.local
```

In the Supabase dashboard go to **Project Settings → API** and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development.

> The **service role** key is never required by the app at runtime for most
> features, but **is required for Stripe webhooks** (Pro activation and link
> unlock recording). Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel.

### 5. Configure Stripe (link unlocks + Pro billing)

Copy Stripe keys from [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys)
into `.env.local`:

- `STRIPE_SECRET_KEY` — `sk_test_...` (dev) or `sk_live_...` (production)
- `STRIPE_WEBHOOK_SECRET` — `whsec_...` (see webhook step below)
- `STRIPE_PRO_MONTHLY_PRICE_ID` — create a Product + recurring Price in Stripe
- `STRIPE_PRO_YEARLY_PRICE_ID` — create a yearly Price on the same Product
- `STRIPE_PLATFORM_FEE_BPS_FREE` — platform fee for free creators (default `2000` = 20%)
- `STRIPE_PLATFORM_FEE_BPS_PRO` — platform fee for Pro creators (default `800` = 8%)

**Stripe Connect (creator payouts for locked links):**

1. In [Stripe Dashboard → Connect](https://dashboard.stripe.com/connect/accounts/overview), complete platform setup.
2. Creators connect payouts at **Dashboard → Payouts** in OnlyLinks.
3. Locked-link checkout uses destination charges: fan pays → creator receives net amount → OnlyLinks keeps the platform fee.

**Webhook (required for Pro + unlock persistence + Connect status):**

1. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   `https://your-domain.com/api/stripe/webhook`
2. Listen for: `checkout.session.completed`, `account.updated`,
   `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`

**Local webhook testing:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the whsec_... secret it prints into STRIPE_WEBHOOK_SECRET
```

**Apply migration `0008_unlock_check.sql`** (unlock persistence RPC):

Run in Supabase SQL Editor or `pnpm migrate` if configured.

### 6. Configure Auth providers

In the Supabase dashboard under **Authentication**:

- **URL Configuration** → set **Site URL** to `http://localhost:3000` and add
  `http://localhost:3000/**` (and later your production URL) to **Redirect URLs**.
- **Email**: enabled by default. For the smoothest local testing you can turn
  **Confirm email** off under *Authentication → Providers → Email* (turn it
  back on for production).
- **Google OAuth** (optional but supported):
  1. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth
     credentials (*APIs & Services → Credentials → Create credentials → OAuth client ID → Web application*).
  2. Add the **Authorized redirect URI** shown in Supabase's Google provider
     settings — it looks like
     `https://<your-project-ref>.supabase.co/auth/v1/callback`.
  3. Copy the Google **Client ID** and **Client secret** into Supabase's Google
     provider settings and enable it.

The app's own OAuth return route is `/auth/callback`, which exchanges the code
for a session.

### 7. Run it

```bash
pnpm dev
```

Open <http://localhost:3000>, sign up, claim a handle, add links, and visit
`/<your-handle>`.

### 8. (Optional) Regenerate database types

The committed `src/lib/database.types.ts` is hand-written to match the
migration. To replace it with Supabase's canonical generated types:

```bash
# requires the Supabase CLI and a logged-in session
export SUPABASE_PROJECT_ID=your-project-ref
pnpm gen:types
```

---

## Verifying the build

```bash
pnpm typecheck   # tsc --noEmit, strict mode
pnpm lint        # next lint
pnpm build       # production build
```

> Note: this project was authored in an environment where the build could not
> be executed, so please run the three commands above once after
> `pnpm install` to confirm everything compiles in your toolchain. They should
> pass with the dependency versions pinned in `package.json`.

---

## Deploying to Vercel

1. Push this repo to GitHub and import it at <https://vercel.com/new>.
2. Add the environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your production URL (e.g. `https://onlylinks.app`)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for Stripe webhooks)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID`
3. In Supabase **Authentication → URL Configuration**, add your production URL
   to **Site URL** and **Redirect URLs** (e.g. `https://onlylinks.app/**`).
4. If using Google OAuth, the Supabase callback URL stays the same; just make
   sure your production domain is in Supabase's redirect allow-list.
5. Deploy.

---

## Project structure

```
src/
  app/
    page.tsx                landing page
    login/ , signup/        auth pages (email + Google)
    auth/callback/          OAuth + email-confirm code exchange
    auth/signout/           sign-out route
    onboarding/             first-login handle claim
    dashboard/              auth-gated: profile, links, analytics
    [handle]/               public profile (Server Component) + 404 + loading
    l/[linkId]/             click tracker → logs event → redirects
  actions/                  server actions (Zod-validated mutations)
  components/               UI primitives + feature components
  lib/
    supabase/               browser / server / middleware clients
    validations.ts          Zod schemas
    queries.ts              server-side data fetching helpers
    database.types.ts       typed schema
  middleware.ts             session refresh + route protection
supabase/
  migrations/0001_init.sql  schema + RLS + storage
```

---

## Security notes

- **Row-Level Security** is enabled on every table. `profiles` and `links` are
  publicly readable (the public page needs them); writes are restricted to the
  owning user. `click_events` and `page_views` accept anonymous inserts but are
  readable only by the owning profile's user.
- All mutations go through **server actions** that re-validate input with Zod
  and rely on RLS as the authoritative access check.
- The **service-role key is never imported on the client**. The browser and
  server clients both use the anon key, so RLS always applies.
- User-supplied URLs are normalized and restricted to `http(s)` before use.

---

## v2: adding paid link unlocks (Stripe)

The schema already carries the hooks, so v2 adds **no migration churn** to the
existing tables. v1 ignores `is_locked` at render time and shows every link
normally. To add one-time unlocks:

1. **New table** for unlock records (additive migration):

   ```sql
   create table public.unlocks (
     id          uuid primary key default gen_random_uuid(),
     link_id     uuid not null references public.links(id) on delete cascade,
     buyer_email text,                       -- or buyer_id uuid if buyers have accounts
     stripe_payment_intent text unique,
     created_at  timestamptz not null default now()
   );
   alter table public.unlocks enable row level security;
   -- readable by the link owner; inserts happen server-side via webhook (service role)
   ```

2. **Mark links as locked.** In the dashboard, expose the existing
   `links.is_locked` and `links.price_cents` columns (a toggle + price field).
   No schema change needed — just stop ignoring them in the UI.

3. **Checkout.** Add a Stripe one-time `PaymentIntent` / Checkout Session
   created from a server action or route handler. Store the Stripe keys as
   server-only env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — never
   `NEXT_PUBLIC`.

4. **Fulfilment.** Add a Stripe webhook route (`/api/stripe/webhook`) that, on
   `payment_intent.succeeded`, inserts an `unlocks` row using the **service-role**
   client (server-only) so it bypasses RLS for trusted writes.

5. **Gate the redirect.** In `src/app/l/[linkId]/route.ts`, before redirecting,
   check `is_locked`: if locked and the visitor has no matching `unlocks` row,
   redirect to a paywall/checkout page instead of the destination. The public
   page (`src/app/[handle]/page.tsx`) can render a lock badge for locked links.

Because `is_locked` and `price_cents` already exist on `links`, steps 2–5 are
purely application code plus the additive `unlocks` table — the v1 tables and
their RLS policies stay untouched.
