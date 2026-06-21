import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashVisitorId, extractIp } from "@/lib/analytics";
import { readAccessCookie, validateAccessCookie } from "@/lib/access-grants";
import { hasLinkUnlock } from "@/lib/unlocks";

/** GET /api/stripe/unlock-status?linkId=xxx — has this visitor already paid? */
export async function GET(request: NextRequest) {
  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

  const supabase = await createClient();
  const cookieToken = readAccessCookie(request.cookies, linkId);

  if (cookieToken && (await validateAccessCookie(supabase, linkId, cookieToken))) {
    return NextResponse.json({ unlocked: true, redirectTo: `/l/${linkId}` });
  }

  const ua = request.headers.get("user-agent");
  const ip = extractIp(request.headers);
  const visitorId = await hashVisitorId(ip, ua);
  const unlocked = await hasLinkUnlock(supabase, linkId, visitorId);

  if (!unlocked) {
    return NextResponse.json({ unlocked: false });
  }

  return NextResponse.json({ unlocked: true, redirectTo: `/l/${linkId}` });
}
