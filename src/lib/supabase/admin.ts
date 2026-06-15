import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client. Bypasses Row-Level Security, so it must ONLY
 * ever be used in trusted server contexts (e.g. the Stripe webhook) where the
 * request has already been authenticated by other means (here: a verified
 * Stripe signature) — never in response to an unverified user request, and
 * never imported into client code. The service-role key is read from a
 * non-public env var, so it is never sent to the browser.
 *
 * Returns null when the service-role key is not configured, so callers can
 * degrade gracefully instead of crashing at import time.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
