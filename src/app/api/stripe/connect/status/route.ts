import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import {
  connectStatusFromProfile,
  getPlatformFeeBps,
  formatPlatformFeePercent,
} from "@/lib/stripe-connect";
import { syncConnectAccount } from "@/lib/stripe-connect-sync";
import {
  effectiveSubscriptionStatus,
  readPreviewPlan,
  PREVIEW_PLAN_COOKIE,
} from "@/lib/admin";

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
      "handle, subscription_status, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted",
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
      "handle, subscription_status, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted",
    )
    .eq("id", user.id)
    .maybeSingle();

  const current = refreshedProfile ?? profile;
  const cookieStore = await cookies();
  const tier = effectiveSubscriptionStatus({
    profile: current,
    email: user.email,
    previewPlan: readPreviewPlan(cookieStore.get(PREVIEW_PLAN_COOKIE)?.value),
  });
  const status = connectStatusFromProfile(current);

  return NextResponse.json({
    ...status,
    subscriptionTier: tier,
    platformFeePercent: formatPlatformFeePercent(getPlatformFeeBps(tier)),
    platformFeeBpsFree: getPlatformFeeBps("free"),
    platformFeeBpsPro: getPlatformFeeBps("pro"),
  });
}
