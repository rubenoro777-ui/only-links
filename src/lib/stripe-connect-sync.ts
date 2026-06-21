import type Stripe from "stripe";
import type { PublicSupabaseClient } from "@/lib/supabase/types";

export function connectFieldsFromStripeAccount(account: Stripe.Account) {
  return {
    stripe_connect_charges_enabled: account.charges_enabled ?? false,
    stripe_connect_payouts_enabled: account.payouts_enabled ?? false,
    stripe_connect_details_submitted: account.details_submitted ?? false,
  };
}

export async function syncConnectAccount(
  supabase: PublicSupabaseClient,
  account: Stripe.Account,
): Promise<void> {
  const fields = connectFieldsFromStripeAccount(account);
  const profileId = account.metadata?.profile_id;

  if (profileId) {
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", profileId);
    if (error) {
      console.error("syncConnectAccount by profile_id failed:", error.message);
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("stripe_connect_account_id", account.id);

  if (error) {
    console.error("syncConnectAccount by account id failed:", error.message);
  }
}
