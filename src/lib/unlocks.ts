import type { PublicSupabaseClient } from "@/lib/supabase/types";

export async function hasLinkUnlock(
  supabase: PublicSupabaseClient,
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
