import { redirect } from "next/navigation";
import { HandleClaimForm } from "@/components/onboarding/handle-claim-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { SITE_NAME } from "@/lib/site";

export const metadata = { title: "Claim your handle" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight">{SITE_NAME}</span>
          <h1 className="mt-6 text-xl font-semibold">One last step</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a unique handle for your public page. You can&apos;t change it
            later, so choose well.
          </p>
        </div>
        <HandleClaimForm />
      </div>
    </main>
  );
}
