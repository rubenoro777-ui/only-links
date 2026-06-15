// scripts/migrate.mjs
//
// Applies any not-yet-applied SQL files in supabase/migrations to the database,
// tracking what's been run in a `schema_migrations` table. Idempotent: running
// it repeatedly only applies new files. Wired into redeploy.bat so a database
// change ships with the same one double-click as a code change — no more
// pasting SQL into the Supabase dashboard.
//
// Uses the Supabase Management API (no `pg` package, no database password, no
// pooler hostname). It needs:
//   - SUPABASE_ACCESS_TOKEN  : a Supabase personal access token (sbp_...),
//                              created at https://supabase.com/dashboard/account/tokens
//   - the project ref, derived automatically from NEXT_PUBLIC_SUPABASE_URL
// Both come from .env.local, which the bat loads via `node --env-file`.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

const token = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref =
  process.env.SUPABASE_PROJECT_ID ||
  supabaseUrl.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ||
  "";

if (!token) {
  console.log(
    [
      "",
      "  ⏭  Skipping migrations — SUPABASE_ACCESS_TOKEN is not set.",
      "",
      "  One-time setup to enable auto-migrations:",
      "    1. https://supabase.com/dashboard/account/tokens → Generate new token",
      "    2. Copy it (starts with sbp_) — it's shown only once",
      "    3. Add it to .env.local as:  SUPABASE_ACCESS_TOKEN=sbp_...",
      "",
      "  (Deploy will continue without applying migrations.)",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

if (!ref) {
  console.error(
    "  ✗  Could not determine the project ref. Set SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL in .env.local.",
  );
  process.exit(1);
}

const ENDPOINT = `https://api.supabase.com/v1/projects/${ref}/database/query`;

/** Run SQL against the project via the Management API. Throws on error. */
async function runSql(query) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).message ?? text;
    } catch {
      /* keep raw text */
    }
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return text ? JSON.parse(text) : [];
}

/** Numeric prefix of a migration filename, e.g. "0002_socials.sql" -> 2. */
function num(file) {
  const m = file.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

/** SQL-escape a string literal. */
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

async function main() {
  await runSql(`
    create table if not exists public.schema_migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const appliedRows = await runSql(
    "select filename from public.schema_migrations",
  );
  const applied = new Set(appliedRows.map((r) => r.filename));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => num(a) - num(b) || a.localeCompare(b));

  // Baseline: on the first run against an already-existing database, mark the
  // initial migration(s) as applied WITHOUT re-running them — their policies
  // aren't safe to execute twice. 0002+ is written idempotently and runs normally.
  if (applied.size === 0) {
    const existsRows = await runSql(
      "select to_regclass('public.profiles') as t",
    );
    const schemaExists = existsRows[0]?.t != null;
    if (schemaExists) {
      for (const file of files) {
        if (num(file) <= 1) {
          await runSql(
            `insert into public.schema_migrations(filename) values (${lit(file)}) on conflict do nothing`,
          );
          applied.add(file);
          console.log(`  ⏭  baseline (already applied): ${file}`);
        }
      }
    }
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log("  ✓  Database is up to date — no new migrations.");
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`  →  applying ${file} ... `);
    // Append the tracking insert so a successful apply is recorded in the same
    // request. Migrations are idempotent, so a retry after a partial failure is
    // safe.
    await runSql(
      `${sql}\n;insert into public.schema_migrations(filename) values (${lit(file)}) on conflict do nothing;`,
    );
    console.log("done");
  }

  console.log(`  ✓  Applied ${pending.length} migration(s).`);
}

main().catch((err) => {
  console.error("\n  ✗  Migration error:\n", err.message || err);
  process.exit(1);
});
