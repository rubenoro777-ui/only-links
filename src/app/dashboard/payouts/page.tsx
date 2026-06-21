import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { isPro } from "@/lib/pro";
import { STRIPE_CONFIGURED } from "@/lib/stripe";
import { PayoutsClient } from "@/components/dashboard/payouts-client";

export const metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Stripe to get paid when fans unlock your locked links.
        </p>
      </div>

      <PayoutsClient stripeConfigured={STRIPE_CONFIGURED} isPro={isPro(profile)} />
    </div>
  );
}
