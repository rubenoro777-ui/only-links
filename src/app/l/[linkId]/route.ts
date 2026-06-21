import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";
import { parseUA, hashVisitorId, extractIp } from "@/lib/analytics";
import {
  accessCookieOptions,
  getAccessTokenForVisitor,
  readAccessCookie,
  redeemHandoffToken,
  validateAccessCookie,
} from "@/lib/access-grants";
import { hasLinkUnlock } from "@/lib/unlocks";

type LinkRow = { id: string; url: string; is_locked: boolean };

async function logClick(
  supabase: Awaited<ReturnType<typeof createClient>>,
  link: LinkRow,
  request: NextRequest,
  visitorId: string | null,
): Promise<void> {
  try {
    const ua = request.headers.get("user-agent");
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
}

function redirectToDestination(
  destination: string,
  linkId: string,
  accessToken: string | null,
): NextResponse {
  const response = NextResponse.redirect(destination, { status: 307 });
  if (accessToken) {
    response.cookies.set({
      ...accessCookieOptions(linkId),
      value: accessToken,
    });
  }
  return response;
}

/**
 * Click tracker. Looks up the link, records an enriched click_event
 * (anonymous inserts are allowed by RLS), then redirects to the destination.
 *
 * Locked links require a private access grant:
 * - short-lived one-time handoff token (?t=...) like a password-manager share link
 * - durable HttpOnly cookie after the handoff is redeemed
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
  const link = linkRow as LinkRow | null;

  if (!link) {
    return NextResponse.redirect(home, { status: 307 });
  }

  const ua = request.headers.get("user-agent");
  const ip = extractIp(request.headers);
  const visitorId = await hashVisitorId(ip, ua);

  if (link.is_locked) {
    const handoffToken = request.nextUrl.searchParams.get("t")?.trim() ?? null;
    const cookieToken = readAccessCookie(request.cookies, linkId);

    if (handoffToken) {
      const redeemed = await redeemHandoffToken(supabase, linkId, handoffToken);
      if (redeemed) {
        const destination = normalizeUrl(link.url);
        if (!destination) return NextResponse.redirect(home, { status: 307 });
        await logClick(supabase, link, request, visitorId);
        return redirectToDestination(destination, linkId, handoffToken);
      }
    }

    if (cookieToken && (await validateAccessCookie(supabase, linkId, cookieToken))) {
      const destination = normalizeUrl(link.url);
      if (!destination) return NextResponse.redirect(home, { status: 307 });
      await logClick(supabase, link, request, visitorId);
      return redirectToDestination(destination, linkId, null);
    }

    const legacyUnlock = await hasLinkUnlock(supabase, linkId, visitorId);
    if (legacyUnlock) {
      const destination = normalizeUrl(link.url);
      if (!destination) return NextResponse.redirect(home, { status: 307 });
      const legacyToken = visitorId
        ? await getAccessTokenForVisitor(supabase, linkId, visitorId)
        : null;
      await logClick(supabase, link, request, visitorId);
      return redirectToDestination(destination, linkId, legacyToken);
    }

    const unlockUrl = new URL(`/unlock/${linkId}`, request.url);
    return NextResponse.redirect(unlockUrl, { status: 307 });
  }

  const destination = normalizeUrl(link.url);
  if (!destination) {
    return NextResponse.redirect(home, { status: 307 });
  }

  await logClick(supabase, link, request, visitorId);
  return NextResponse.redirect(destination, { status: 307 });
}
