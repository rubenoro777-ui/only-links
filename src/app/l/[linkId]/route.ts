import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";
import { parseUA, hashVisitorId, extractIp } from "@/lib/analytics";
import { hasLinkUnlock } from "@/lib/unlocks";

/**
 * Click tracker. Looks up the link, records an enriched click_event
 * (anonymous inserts are allowed by RLS), then redirects to the destination.
 *
 * Locked links: visitors who already paid (matching visitor_id in link_unlocks)
 * proceed to the destination; everyone else is sent to /unlock.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const home = new URL("/", request.url);

  const supabase = await createClient();
  const { data: linkRow } = await supabase
    .from("links")
    .select("id, url, is_locked")
    .eq("id", linkId)
    .maybeSingle();
  const link = linkRow as { id: string; url: string; is_locked: boolean } | null;

  if (!link) {
    return NextResponse.redirect(home, { status: 307 });
  }

  const ua = request.headers.get("user-agent");
  const ip = extractIp(request.headers);
  const visitorId = await hashVisitorId(ip, ua);

  if (link.is_locked) {
    const unlocked = await hasLinkUnlock(supabase, linkId, visitorId);
    if (!unlocked) {
      const unlockUrl = new URL(`/unlock/${linkId}`, request.url);
      return NextResponse.redirect(unlockUrl, { status: 307 });
    }
  }

  const destination = normalizeUrl(link.url);
  if (!destination) {
    return NextResponse.redirect(home, { status: 307 });
  }

  try {
    const { device_type, browser, os } = parseUA(ua);

    await supabase.from("click_events").insert({
      link_id: link.id,
      referrer: request.headers.get("referer"),
      visitor_id: visitorId,
      country: request.headers.get("x-vercel-ip-country"),
      city: request.headers.get("x-vercel-ip-city"),
      device_type,
      browser,
      os,
    });
  } catch {
    // Swallow logging errors so the redirect always succeeds.
  }

  return NextResponse.redirect(destination, { status: 307 });
}
