import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function hasLinkUnlock(
  supabase: Client,
  linkId: string,
  visitorId: string | null,
): Promise<boolean> {
  if (!visitorId) return false;

  const { data, error } = await supabase.rpc("has_link_unlock", {
    p_link_id: linkId,
    p_visitor_id: visitorId,
  });

  if (error) {
    console.error("has_link_unlock RPC failed:", error.message);
    return false;
  }

  return data === true;
}
