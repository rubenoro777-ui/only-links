#!/usr/bin/env node
/**
 * Local Stripe diagnostics — no secrets logged.
 * Usage: node --env-file=.env.local scripts/diagnose-stripe.mjs
 */
import { appendFileSync } from "node:fs";
import Stripe from "stripe";

const LOG = "debug-989aee.log";
const sessionId = "989aee";

function log(hypothesisId, message, data) {
  const line = JSON.stringify({
    sessionId,
    hypothesisId,
    location: "scripts/diagnose-stripe.mjs",
    message,
    data,
    timestamp: Date.now(),
    runId: "diagnose",
  });
  appendFileSync(LOG, `${line}\n`);
  console.log(`[${hypothesisId}] ${message}`, data);
}

const key = process.env.STRIPE_SECRET_KEY;
const mode = key?.startsWith("sk_live_") ? "live" : key?.startsWith("sk_test_") ? "test" : "missing";

log("H1", "stripe_key_presence", {
  configured: Boolean(key),
  mode,
  keyPrefix: key ? key.slice(0, 8) : null,
});

if (!key) {
  console.error("\nSTRIPE_SECRET_KEY missing — add to .env.local and Vercel.\n");
  process.exit(1);
}

const stripe = new Stripe(key);

try {
  const balance = await stripe.balance.retrieve();
  log("H2", "stripe_api_ok", { livemode: balance.livemode });
} catch (err) {
  const msg = err instanceof Error ? err.message : "unknown";
  log("H2", "stripe_api_failed", { error: msg });
  process.exit(1);
}

try {
  const accounts = await stripe.accounts.list({ limit: 5 });
  log("H5", "connect_platform_ok", {
    connectAccountCount: accounts.data.length,
    canListConnectAccounts: true,
  });
  for (const acct of accounts.data) {
    log("H3", "connect_account_status", {
      accountId: acct.id,
      chargesEnabled: acct.charges_enabled,
      payoutsEnabled: acct.payouts_enabled,
      detailsSubmitted: acct.details_submitted,
      requirementsCurrentlyDue: acct.requirements?.currently_due?.length ?? 0,
      requirementsPendingVerification:
        acct.requirements?.pending_verification?.length ?? 0,
    });
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : "unknown";
  log("H5", "connect_platform_blocked", {
    error: msg,
    hint: "Enable Connect at https://dashboard.stripe.com/test/connect/overview (test mode)",
  });
}

const monthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const yearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
log("H4", "pro_price_ids", {
  monthlySet: Boolean(monthly),
  yearlySet: Boolean(yearly),
  monthlyPrefix: monthly?.slice(0, 12) ?? null,
});

if (monthly) {
  try {
    const price = await stripe.prices.retrieve(monthly);
    log("H4", "monthly_price_mode", { livemode: price.livemode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log("H4", "monthly_price_invalid", { error: msg });
  }
}

console.log("\nDiagnostics written to debug-989aee.log\n");
