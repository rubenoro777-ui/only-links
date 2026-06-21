#!/usr/bin/env node
/**
 * Sync Stripe (and site URL) env vars from .env.local to Vercel production.
 * Usage: node --env-file=.env.local scripts/sync-stripe-to-vercel.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
  "NEXT_PUBLIC_SITE_URL",
  "ONLYLINKS_OWNER_EMAILS",
  "ONLYLINKS_OWNER_HANDLES",
];

function parseEnvFile(path) {
  const text = readFileSync(path, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value) out[key] = value;
  }
  return out;
}

const env = parseEnvFile(".env.local");
const missing = KEYS.filter((k) => !env[k]);

if (missing.includes("STRIPE_SECRET_KEY")) {
  console.error("\n❌ STRIPE_SECRET_KEY is missing in .env.local");
  console.error("   Get it from: https://dashboard.stripe.com/apikeys");
  console.error("   Paste sk_live_... (or sk_test_... for test mode) into .env.local\n");
  process.exit(1);
}

console.log("Syncing to Vercel production...\n");

for (const key of KEYS) {
  const value = env[key];
  if (!value) {
    console.log(`⏭  Skipping ${key} (empty)`);
    continue;
  }
  const result = spawnSync(
    "vercel",
    ["env", "add", key, "production", "--force"],
    { input: value, encoding: "utf8", shell: true },
  );
  if (result.status !== 0) {
    console.error(`❌ Failed to set ${key}:`, result.stderr || result.stdout);
    process.exit(1);
  }
  console.log(`✓  ${key}`);
}

console.log("\nDone. Redeploy for changes to take effect:");
console.log("  vercel --prod\n");
