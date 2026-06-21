import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, CreditCard, Wallet } from "lucide-react";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { getPlanAccess } from "@/lib/admin-access";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";
import { AdminModeBar } from "@/components/dashboard/admin-mode-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const access = await getPlanAccess(profile, user.email);

  return (
    <div className="min-h-dvh bg-muted/30">
      {access.isOwner && (
        <AdminModeBar
          previewPlan={access.previewPlan}
          hasProAccess={access.hasProAccess}
          isProSubscriber={access.isProSubscriber}
        />
      )}
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/dashboard" className="shrink-0 font-bold tracking-tight">
            {SITE_NAME}
          </Link>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="min-w-0 max-w-[130px] sm:max-w-none">
              <Link href={`/${profile.handle}`} target="_blank" className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm">/{profile.handle}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="size-8 shrink-0" title="Payouts">
              <Link href="/dashboard/payouts">
                <Wallet className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="size-8 shrink-0" title="Billing">
              <Link href="/dashboard/billing">
                <CreditCard className="size-4" />
                {access.hasProAccess && (
                  <span className="sr-only">Pro</span>
                )}
              </Link>
            </Button>
            {access.hasProAccess && (
              <span className="hidden sm:inline text-xs font-semibold text-primary">
                {access.isProSubscriber ? "Pro" : "Pro (owner)"}
              </span>
            )}
            <form action="/auth/signout" method="post" className="shrink-0">
              <Button type="submit" variant="outline" size="sm" className="text-xs">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
