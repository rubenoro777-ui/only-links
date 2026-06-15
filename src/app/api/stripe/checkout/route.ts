import { NextResponse, type NextRequest } from "next/server";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import { getSiteUrl } from "@/lib/site";
import { hashVisitorId, extractIp } from "@/lib/analytics";
import { headers } from "next/headers";

type CheckoutBody = {
  type: string;
  linkId?: string;
  interval?: string;
};

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Payment service unavailable. Please try again.";
}

/**
 * POST /api/stripe/checkout
 *
 * Body (JSON):
 *   { type: "link_unlock", linkId: string }
 *   { type: "pro", interval: "month" | "year" }
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const siteUrl = getSiteUrl();

  if (body.type === "link_unlock") {
    const { linkId } = body;
    if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

    const supabase = await createClient();
    const { data: linkRow } = await supabase
      .from("links")
      .select("id, title, price_cents, profile_id")
      .eq("id", linkId)
      .eq("is_locked", true)
      .maybeSingle();

    if (!linkRow || !linkRow.price_cents) {
      return NextResponse.json({ error: "Link not found or not locked" }, { status: 404 });
    }

    const reqHeaders = await headers();
    const ua = reqHeaders.get("user-agent");
    const ip = extractIp(reqHeaders);
    const visitorId = await hashVisitorId(ip, ua);

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: linkRow.title },
              unit_amount: linkRow.price_cents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          link_id: linkId,
          visitor_id: visitorId ?? "",
        },
        success_url: `${siteUrl}/unlock/${linkId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/unlock/${linkId}?cancelled=1`,
      });

      if (!session.url) {
        return NextResponse.json({ error: "Could not create checkout session" }, { status: 502 });
      }

      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error("stripe checkout (link_unlock) failed:", err);
      return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
    }
  }

  if (body.type === "pro") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const priceId =
      body.interval === "year" ? STRIPE_PRICES.proYearly : STRIPE_PRICES.proMonthly;
    if (!priceId) {
      return NextResponse.json(
        { error: "Pro price not configured. Set STRIPE_PRO_MONTHLY_PRICE_ID and STRIPE_PRO_YEARLY_PRICE_ID." },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { profile_id: user.id },
        ...(profile?.stripe_customer_id
          ? { customer: profile.stripe_customer_id }
          : { customer_email: user.email }),
        success_url: `${siteUrl}/dashboard/billing?upgraded=1`,
        cancel_url: `${siteUrl}/dashboard/billing`,
      });

      if (!session.url) {
        return NextResponse.json({ error: "Could not create checkout session" }, { status: 502 });
      }

      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error("stripe checkout (pro) failed:", err);
      return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
