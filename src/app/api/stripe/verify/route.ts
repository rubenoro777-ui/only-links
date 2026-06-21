import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import {
  buildHandoffPath,
  createGrantFields,
  getAccessTokenForSession,
} from "@/lib/access-grants";

/**
 * GET /api/stripe/verify?session_id=xxx&link_id=xxx
 *
 * Called by the unlock page after Stripe redirects back with a session_id.
 * Verifies the payment, records the unlock if not already done, and returns
 * a short-lived private handoff path instead of the destination URL.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const linkId = request.nextUrl.searchParams.get("link_id");

  if (!sessionId || !linkId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("stripe session retrieve failed:", err);
    return NextResponse.json({ error: "Could not verify payment session" }, { status: 502 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  if (session.metadata?.link_id !== linkId) {
    return NextResponse.json({ error: "Session/link mismatch" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: linkRow } = await supabase
    .from("links")
    .select("access_ttl_minutes")
    .eq("id", linkId)
    .maybeSingle();

  const grantFields = createGrantFields(linkRow?.access_ttl_minutes);
  const platformFeeCents = Number.parseInt(
    session.metadata?.platform_fee_cents ?? "",
    10,
  );
  const creatorNetCents = Number.parseInt(
    session.metadata?.creator_net_cents ?? "",
    10,
  );

  const { error: upsertError } = await supabase.from("link_unlocks").upsert(
    {
      link_id: linkId,
      stripe_session_id: sessionId,
      visitor_id: session.metadata?.visitor_id || null,
      email: session.customer_details?.email ?? null,
      ...(Number.isFinite(platformFeeCents)
        ? { platform_fee_cents: platformFeeCents }
        : {}),
      ...(Number.isFinite(creatorNetCents)
        ? { creator_net_cents: creatorNetCents }
        : {}),
      ...grantFields,
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );

  if (upsertError) {
    console.error("verify link_unlocks upsert failed:", upsertError.message);
    return NextResponse.json({ error: "Could not record unlock" }, { status: 500 });
  }

  const accessToken = await getAccessTokenForSession(supabase, sessionId);
  if (!accessToken) {
    return NextResponse.json({ error: "Could not issue access grant" }, { status: 500 });
  }

  return NextResponse.json({ redirectTo: buildHandoffPath(linkId, accessToken) });
}
