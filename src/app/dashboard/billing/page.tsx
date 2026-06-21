import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { getPlanAccess } from "@/lib/admin-access";
import {
  PLAN_FEATURES,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
} from "@/lib/pro";
import { STRIPE_CONFIGURED, STRIPE_PRO_PRICES_CONFIGURED } from "@/lib/stripe";
import { BillingClient } from "@/components/dashboard/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const access = await getPlanAccess(profile, user.email);
  const ownerAccess = access.hasProAccess && !access.isProSubscriber;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Plans &amp; billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {access.isProSubscriber
            ? "You're on the Pro plan. Manage or cancel your subscription below."
            : access.hasProAccess
              ? "Owner access is enabled — all Pro features are unlocked for testing."
              : "Choose a plan that fits your needs."}
        </p>
      </div>

      <BillingClient
        hasProAccess={access.hasProAccess}
        isProSubscriber={access.isProSubscriber}
        isOwnerAccess={ownerAccess}
        stripeConfigured={STRIPE_CONFIGURED && STRIPE_PRO_PRICES_CONFIGURED}
        monthlyPrice={PRO_PRICE_MONTHLY_CENTS}
        yearlyPrice={PRO_PRICE_YEARLY_CENTS}
        features={PLAN_FEATURES}
      />
    </div>
  );
}
