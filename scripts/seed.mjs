// ---------------------------------------------------------------------------
// OnlyLinks demo seed
// ---------------------------------------------------------------------------
// Creates a demo account with a populated public page so you can see the app
// working right after setup. Safe to run more than once (idempotent).
//
// Run it with:
//   pnpm seed
// which is:
//   node --env-file=.env.local scripts/seed.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Project Settings -> API).
// The service-role key is admin-level: only ever used here, locally, never in
// the app or the browser.
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!url || !serviceKey) {
  console.error(
    "\n✗ Missing env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,\n  then run:  node --env-file=.env.local scripts/seed.mjs\n",
  );
  process.exit(1);
}

const DEMO = {
  email: "demo@onlylinks.app",
  password: "demo-password-123",
  handle: "demo",
  display_name: "Demo Creator",
  bio: "👋 This is a demo OnlyLinks page. Log in as demo@onlylinks.app to edit it.",
};

const LINKS = [
  { title: "🌐 My website", url: "https://example.com" },
  { title: "📸 Instagram", url: "https://instagram.com" },
  { title: "🎬 YouTube channel", url: "https://youtube.com" },
  { title: "🐙 GitHub", url: "https://github.com" },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO.email,
    password: DEMO.password,
    email_confirm: true,
  });

  if (!error && data.user) return data.user;

  // Already exists -> look it up.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === DEMO.email);
  if (!existing) throw error ?? new Error("Could not create or find demo user.");
  return existing;
}

async function main() {
  console.log("Seeding demo data…");

  const user = await getOrCreateUser();

  // Profile (upsert so re-runs just refresh it).
  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      handle: DEMO.handle,
      display_name: DEMO.display_name,
      bio: DEMO.bio,
    },
    { onConflict: "id" },
  );
  if (profileErr) throw profileErr;

  // Replace links each run for a clean slate.
  await admin.from("links").delete().eq("profile_id", user.id);
  const rows = LINKS.map((l, i) => ({
    profile_id: user.id,
    title: l.title,
    url: l.url,
    position: i,
  }));
  const { data: insertedLinks, error: linksErr } = await admin
    .from("links")
    .insert(rows)
    .select("id");
  if (linksErr) throw linksErr;

  // Sample analytics: a handful of page views + clicks.
  await admin.from("page_views").delete().eq("profile_id", user.id);
  const views = Array.from({ length: 12 }, () => ({ profile_id: user.id }));
  await admin.from("page_views").insert(views);

  const clicks = [];
  (insertedLinks ?? []).forEach((link, i) => {
    const n = [7, 4, 2, 1][i] ?? 1; // first link gets the most clicks
    for (let c = 0; c < n; c++) clicks.push({ link_id: link.id });
  });
  if (clicks.length) await admin.from("click_events").insert(clicks);

  console.log("\n✓ Done!\n");
  console.log(`  Public page:  ${siteUrl}/${DEMO.handle}`);
  console.log(`  Log in with:  ${DEMO.email}  /  ${DEMO.password}`);
  console.log("\n  (Change or delete this demo account anytime.)\n");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
