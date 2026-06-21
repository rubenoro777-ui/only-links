import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import type { PublicSupabaseClient } from "@/lib/supabase/types";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth session via Next.js cookies. Uses the public anon key,
 * so Row-Level Security still applies — the service-role key is never used here.
 */
export async function createClient(): Promise<PublicSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` was called from a Server Component. This can be ignored
            // when middleware is refreshing the session (see middleware.ts).
          }
        },
      },
    },
  );
}
