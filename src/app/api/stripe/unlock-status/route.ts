import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";
import { hashVisitorId, extractIp } from "@/lib/analytics";
import { hasLinkUnlock } from "@/lib/unlocks";

/** GET /api/stripe/unlock-status?linkId=xxx — has this visitor already paid? */
export async function GET(request: NextRequest) {
  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

  const supabase = await createClient();
  const ua = request.headers.get("user-agent");
  const ip = extractIp(request.headers);
  const visitorId = await hashVisitorId(ip, ua);
  const unlocked = await hasLinkUnlock(supabase, linkId, visitorId);

  if (!unlocked) {
    return NextResponse.json({ unlocked: false });
  }

  const { data: link } = await supabase
    .from("links")
    .select("url")
    .eq("id", linkId)
    .maybeSingle();

  const url = link ? normalizeUrl(link.url) : null;
  return NextResponse.json({ unlocked: true, url });
}
