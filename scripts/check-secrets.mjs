#!/usr/bin/env node
/**
 * Scans tracked git files for accidental secret commits.
 * Run before push: pnpm check-secrets
 */
import { execSync } from "node:child_process";

const PATTERNS = [
  { name: "Stripe secret key", re: /sk_(test|live)_[A-Za-z0-9]{20,}/ },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{20,}/ },
  { name: "Supabase access token", re: /sbp_[A-Za-z0-9]{20,}/ },
  { name: "Supabase service role JWT", re: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
];

const ALLOWLIST = [
  /\.example$/,
  /README\.md$/,
  /GET-STARTED\.md$/,
  /check-secrets\.mjs$/,
  /sync-stripe-to-vercel\.mjs$/,
  /migrate\.mjs$/,
];

function trackedFiles() {
  return execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

const hits = [];

for (const file of trackedFiles()) {
  if (ALLOWLIST.some((re) => re.test(file))) continue;
  let content;
  try {
    content = execSync(`git show HEAD:${file}`, { encoding: "utf8" });
  } catch {
    continue;
  }
  for (const { name, re } of PATTERNS) {
    const match = content.match(re);
    if (match) {
      hits.push({ file, name, preview: match[0].slice(0, 12) + "…" });
    }
  }
}

if (hits.length > 0) {
  console.error("\n❌ Possible secrets found in tracked files:\n");
  for (const h of hits) {
    console.error(`  ${h.file} — ${h.name} (${h.preview})`);
  }
  console.error("\nRemove secrets before pushing. Secrets belong in .env.local and Vercel only.\n");
  process.exit(1);
}

console.log("✓ No secrets detected in tracked git files.");
