import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import {
  connectStatusFromProfile,
  getPlatformFeeBps,
  formatPlatformFeePercent,
  subscriptionTierFromStatus,
} from "@/lib/stripe-connect";
import { syncConnectAccount } from "@/lib/stripe-connect-sync";

/** GET /api/stripe/connect/status — payout setup status for the signed-in creator */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "subscription_status, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stripe = getStripe();
  if (stripe && profile.stripe_connect_account_id) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
      await syncConnectAccount(supabase, account);
    } catch (err) {
      console.error("stripe connect status sync failed:", err);
    }
  }

  const { data: refreshedProfile } = await supabase
    .from("profiles")
    .select(
      "subscription_status, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted",
    )
    .eq("id", user.id)
    .maybeSingle();

  const current = refreshedProfile ?? profile;
  const tier = subscriptionTierFromStatus(current.subscription_status);
  const status = connectStatusFromProfile(current);

  return NextResponse.json({
    ...status,
    subscriptionTier: tier,
    platformFeePercent: formatPlatformFeePercent(getPlatformFeeBps(tier)),
    platformFeeBpsFree: getPlatformFeeBps("free"),
    platformFeeBpsPro: getPlatformFeeBps("pro"),
  });
}
