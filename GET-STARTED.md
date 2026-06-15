# Get started (the easy version)

This is the no-jargon, copy-paste guide to getting OnlyLinks running on your
own computer. If a step has a grey code box, you copy it and paste it into your
**Terminal** app (on Mac) or **PowerShell** (on Windows). Press Enter after each.

Think of it like this: your app is the storefront, and **Supabase** is the
warehouse out back that holds all the accounts and links. We just need to build
the warehouse, hand the store its keys, and open the doors.

Total time: about 10 minutes. You don't need to know how to code.

---

## Step 0 — One-time tools (skip if you already have them)

You need **Node.js** (runs the app) and **pnpm** (installs the parts).

1. Install Node.js: download the "LTS" version from <https://nodejs.org> and
   click through the installer.
2. Then install pnpm by pasting this:

   ```bash
   npm install -g pnpm
   ```

To check it worked:

```bash
node --version
pnpm --version
```

If each prints a number, you're good.

---

## Step 1 — Install the app's parts

In your Terminal, go into this project's folder and run:

```bash
pnpm install
```

This downloads everything the app needs. It runs once and may take a minute.

---

## Step 2 — Make your free database (Supabase)

1. Go to <https://supabase.com> and sign up (the free plan is plenty).
2. Click **New project**.
3. Give it any name (e.g. "onlylinks"), set a database password (save it
   somewhere), pick the region closest to you, and click **Create**.
4. Wait ~2 minutes for it to finish setting up. ☕

---

## Step 3 — Build the tables

This creates the "shelves" in your warehouse (users, links, click counts).

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/0001_init.sql` from this project, copy
   **everything** in it, and paste it into the editor.
4. Click **Run** (bottom right). You should see "Success".

You only ever do this once.

---

## Step 4 — Hand the app its keys

The app needs 3 values from Supabase to talk to your warehouse.

1. In Supabase, go to **Project Settings** (the gear) → **API**.
2. Keep that page open. Now, in this project, make a copy of the example
   settings file. Paste this in your Terminal:

   ```bash
   cp .env.example .env.local
   ```

   (On Windows PowerShell use: `copy .env.example .env.local`)

3. Open the new `.env.local` file in any text editor and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL=` → paste the **Project URL** from Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` → paste the **anon public** key
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000` → leave exactly as is
   - `SUPABASE_SERVICE_ROLE_KEY=` → paste the **service_role** key
     (only needed for the optional demo in Step 7)

4. Save the file.

> 🔒 `.env.local` holds secrets. It's already set to never be shared or
> uploaded — don't paste these keys anywhere public.

---

## Step 5 — Turn on logins

In Supabase, click **Authentication** in the sidebar:

1. Go to **Sign In / Providers → Email**. It's on by default. For easy testing,
   turn **Confirm email** *off* (so you don't have to click an email link every
   time). You can turn it back on later.
2. Go to **URL Configuration** and make sure **Site URL** is
   `http://localhost:3000`. Under **Redirect URLs**, add `http://localhost:3000/**`.

That's enough to log in with email + password. (Google login is optional — the
`README.md` has those steps if you want it later.)

---

## Step 6 — Open the doors 🎉

```bash
pnpm dev
```

Now open <http://localhost:3000> in your browser. Click **Sign up**, make an
account, pick your handle, and add a link. Your public page is at
`http://localhost:3000/your-handle`.

To stop the app, click the Terminal and press `Ctrl + C`. To start it again
later, just run `pnpm dev`.

---

## Step 7 — (Optional) See a ready-made example page

Want to instantly see what a finished page looks like, with links and view
counts already filled in? Run:

```bash
pnpm seed
```

This creates a demo account. When it finishes it prints a link like
`http://localhost:3000/demo` — open it. You can also log in as that demo user
with the email and password it prints, to poke around the dashboard.

Run it again anytime to reset the demo back to a clean state.

---

## If something breaks

- **"command not found: pnpm"** → redo Step 0.
- **The page loads but signup fails** → double-check the two keys in
  `.env.local` are pasted correctly, then stop (`Ctrl + C`) and run `pnpm dev`
  again. Env changes only take effect on restart.
- **`pnpm seed` says "Missing env vars"** → you skipped the
  `SUPABASE_SERVICE_ROLE_KEY` line in Step 4.
- **Anything else** → run `pnpm build` and read the first error; it usually
  names the file and line.

When you're ready to put this online for real, the `README.md` has the
"Deploying to Vercel" section.
