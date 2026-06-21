"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import type { PublicSupabaseClient } from "@/lib/supabase/types";

/**
 * Supabase client for use in Client Components. Uses only the public anon key.
 */
export function createClient(): PublicSupabaseClient {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
