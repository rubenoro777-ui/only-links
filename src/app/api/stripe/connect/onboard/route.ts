import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Could not start Stripe Connect onboarding.";
}

/** POST /api/stripe/connect/onboard — create or resume Express Connect onboarding */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let accountId = profile.stripe_connect_account_id;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          profile_id: user.id,
        },
      });

      accountId = account.id;

      const { error } = await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);

      if (error) {
        console.error("connect onboard profile update failed:", error.message);
        return NextResponse.json({ error: "Could not save connected account" }, { status: 500 });
      }
    }

    const siteUrl = getSiteUrl();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/dashboard/payouts?refresh=1`,
      return_url: `${siteUrl}/dashboard/payouts?connected=1`,
      type: "account_onboarding",
    });

    if (!accountLink.url) {
      return NextResponse.json({ error: "Could not create onboarding link" }, { status: 502 });
    }

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("stripe connect onboard failed:", err);
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
  }
}
