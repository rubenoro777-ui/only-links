import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/stripe/link-info?linkId=xxx — public metadata for a locked link */
export async function GET(request: NextRequest) {
  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("links")
    .select("id, title, price_cents, profile_id")
    .eq("id", linkId)
    .eq("is_locked", true)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Fetch handle for back-link
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", data.profile_id)
    .maybeSingle();

  return NextResponse.json({
    title: data.title,
    price_cents: data.price_cents ?? 0,
    handle: profile?.handle ?? null,
  });
}
