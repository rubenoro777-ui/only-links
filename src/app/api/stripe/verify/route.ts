import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";

/**
 * GET /api/stripe/verify?session_id=xxx&link_id=xxx
 *
 * Called by the unlock page after Stripe redirects back with a session_id.
 * Verifies the payment, records the unlock if not already done, and returns
 * the destination URL so the client can redirect the visitor.
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

  const { error: upsertError } = await supabase.from("link_unlocks").upsert(
    {
      link_id: linkId,
      stripe_session_id: sessionId,
      visitor_id: session.metadata?.visitor_id || null,
      email: session.customer_details?.email ?? null,
    },
    { onConflict: "stripe_session_id" },
  );

  if (upsertError) {
    console.error("verify link_unlocks upsert failed:", upsertError.message);
    return NextResponse.json({ error: "Could not record unlock" }, { status: 500 });
  }

  const { data: link } = await supabase
    .from("links")
    .select("url")
    .eq("id", linkId)
    .maybeSingle();

  const url = link ? normalizeUrl(link.url) : null;
  if (!url) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  return NextResponse.json({ url });
}
