import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGrantFields } from "@/lib/access-grants";
import { syncConnectAccount } from "@/lib/stripe-connect-sync";

/**
 * Stripe webhook endpoint.
 *
 * Events handled:
 *   checkout.session.completed   - link unlock payment OR Pro subscription start
 *   account.updated              - Stripe Connect onboarding status
 *   customer.subscription.updated - subscription status change (upgrade / downgrade)
 *   customer.subscription.deleted - subscription cancelled / expired
 *
 * To test locally:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const mode = session.mode;

      if (mode === "payment") {
        const linkId = session.metadata?.link_id;
        const visitorId = session.metadata?.visitor_id ?? null;
        if (linkId) {
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

          const { error } = await supabase.from("link_unlocks").upsert(
            {
              link_id: linkId,
              stripe_session_id: session.id,
              visitor_id: visitorId || null,
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
          if (error) {
            console.error("webhook link_unlocks upsert failed:", error.message);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }
      } else if (mode === "subscription") {
        const profileId = session.metadata?.profile_id;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;
        if (profileId && customerId && subscriptionId) {
          const { error } = await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_id: subscriptionId,
              subscription_status: "pro",
            })
            .eq("id", profileId);
          if (error) {
            console.error("webhook pro activation failed:", error.message);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      await syncConnectAccount(supabase, account);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const status = sub.status === "active" ? "pro" : "free";
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_status: status })
        .eq("subscription_id", sub.id);
      if (error) {
        console.error("webhook subscription update failed:", error.message);
        return NextResponse.json({ error: "Database write failed" }, { status: 500 });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_status: "free", subscription_id: null })
        .eq("subscription_id", sub.id);
      if (error) {
        console.error("webhook subscription delete failed:", error.message);
        return NextResponse.json({ error: "Database write failed" }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
