import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { isPro, PLAN_FEATURES, PRO_PRICE_MONTHLY_CENTS, PRO_PRICE_YEARLY_CENTS } from "@/lib/pro";
import { STRIPE_CONFIGURED, STRIPE_PRO_PRICES_CONFIGURED } from "@/lib/stripe";
import { BillingClient } from "@/components/dashboard/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const pro = isPro(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Plans &amp; billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pro
            ? "You're on the Pro plan. Manage or cancel your subscription below."
            : "Choose a plan that fits your needs."}
        </p>
      </div>

      <BillingClient
        isPro={pro}
        stripeConfigured={STRIPE_CONFIGURED && STRIPE_PRO_PRICES_CONFIGURED}
        monthlyPrice={PRO_PRICE_MONTHLY_CENTS}
        yearlyPrice={PRO_PRICE_YEARLY_CENTS}
        features={PLAN_FEATURES}
      />
    </div>
  );
}
