"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanFeature } from "@/lib/pro";

interface Props {
  hasProAccess: boolean;
  isProSubscriber: boolean;
  isOwnerAccess: boolean;
  stripeConfigured: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  features: readonly PlanFeature[];
}

export function BillingClient({
  hasProAccess,
  isProSubscriber,
  isOwnerAccess,
  stripeConfigured,
  monthlyPrice,
  yearlyPrice,
  features,
}: Props) {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [loading, setLoading] = useState<"upgrade" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthly = (monthlyPrice / 100).toFixed(0);
  const yearly = (yearlyPrice / 100).toFixed(0);
  const savePct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const displayPrice =
    interval === "month" ? monthly : (yearlyPrice / 100 / 12).toFixed(2);

  async function handleUpgrade() {
    setLoading("upgrade");
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pro", interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not start checkout.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not open billing portal.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {!hasProAccess && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border p-1 text-sm">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={[
                "rounded-md px-4 py-1.5 font-medium transition-colors",
                interval === "month"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={[
                "flex items-center gap-1.5 rounded-md px-4 py-1.5 font-medium transition-colors",
                interval === "year"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Yearly
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  interval === "year"
                    ? "bg-green-500 text-white"
                    : "bg-green-500/15 text-green-600",
                ].join(" ")}
              >
                -{savePct}%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <PlanCard
          badge={
            !hasProAccess ? (
              <PlanBadge variant="current">Current plan</PlanBadge>
            ) : null
          }
          highlighted={!hasProAccess}
          muted={hasProAccess}
          title="Free"
          price={<p className="text-3xl font-bold tracking-tight">$0</p>}
          subtitle="forever"
          features={features.map((f) => ({ label: f.label, value: f.free }))}
          footer={
            !hasProAccess ? (
              <Button variant="outline" className="w-full" disabled>
                Your current plan
              </Button>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground">
                Included with every account
              </div>
            )
          }
        />

        <PlanCard
          badge={
            hasProAccess ? (
              <PlanBadge variant="active">
                {isOwnerAccess && !isProSubscriber ? "Owner access" : "Active"}
              </PlanBadge>
            ) : (
              <PlanBadge variant="recommended">Recommended</PlanBadge>
            )
          }
          highlighted={hasProAccess}
          title="Pro"
          price={
            hasProAccess ? (
              <p className="text-2xl font-bold tracking-tight">
                {isProSubscriber ? "Subscribed" : "Unlocked"}
              </p>
            ) : (
              <div className="flex items-end gap-1">
                <p className="text-3xl font-bold tracking-tight">${displayPrice}</p>
                <p className="pb-0.5 text-sm text-muted-foreground">/mo</p>
              </div>
            )
          }
          subtitle={
            hasProAccess
              ? isProSubscriber
                ? "Manage billing below"
                : "Full Pro features enabled for testing"
              : interval === "year"
                ? `Billed $${yearly}/yr · saves $${((monthlyPrice * 12 - yearlyPrice) / 100).toFixed(0)}/yr`
                : `Billed $${monthly}/mo`
          }
          features={features.map((f) => ({ label: f.label, value: f.pro }))}
          footer={
            stripeConfigured ? (
              hasProAccess ? (
                isProSubscriber ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePortal}
                    disabled={loading === "portal"}
                  >
                    {loading === "portal" ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Opening…
                      </>
                    ) : (
                      "Manage subscription"
                    )}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground">
                    Owner access — no Stripe subscription on this account
                  </div>
                )
              ) : (
                <Button
                  className="w-full"
                  onClick={handleUpgrade}
                  disabled={loading === "upgrade"}
                >
                  {loading === "upgrade" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    `Upgrade to Pro · $${interval === "month" ? `${monthly}/mo` : `${yearly}/yr`}`
                  )}
                </Button>
              )
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground">
                Payments coming soon
              </div>
            )
          }
        />
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

function PlanCard({
  badge,
  highlighted,
  muted = false,
  title,
  price,
  subtitle,
  features,
  footer,
}: {
  badge: React.ReactNode;
  highlighted?: boolean;
  muted?: boolean;
  title: string;
  price: React.ReactNode;
  subtitle: string;
  features: { label: string; value: boolean | string }[];
  footer: React.ReactNode;
}) {
  return (
    <article
      className={[
        "flex h-full flex-col rounded-xl border p-5 sm:p-6",
        highlighted
          ? "border-2 border-primary bg-background shadow-sm"
          : muted
            ? "border bg-muted/20"
            : "border-2 border-foreground/15 bg-background",
      ].join(" ")}
    >
      <div className="mb-4 min-h-[1.5rem]">{badge}</div>

      <header className="mb-5 min-h-[5.5rem]">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="mt-1">{price}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </header>

      <ul className="flex-1 space-y-2 border-t pt-4">
        {features.map((f) => (
          <FeatureRow key={f.label} label={f.label} value={f.value} />
        ))}
      </ul>

      <div className="mt-6 border-t pt-4">{footer}</div>
    </article>
  );
}

function PlanBadge({
  variant,
  children,
}: {
  variant: "current" | "recommended" | "active";
  children: React.ReactNode;
}) {
  const styles = {
    current: "bg-foreground text-background",
    recommended: "bg-primary/10 text-primary",
    active: "bg-primary text-primary-foreground",
  } as const;

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function FeatureRow({
  label,
  value,
}: {
  label: string;
  value: boolean | string;
}) {
  const included = value !== false;
  const detail = typeof value === "string" ? value : null;

  return (
    <li className="grid grid-cols-[1rem_1fr] gap-x-2.5 gap-y-0.5 text-sm leading-snug">
      <span className="mt-0.5 flex justify-center">
        {included ? (
          <Check className="size-3.5 shrink-0 text-green-500" />
        ) : (
          <X className="size-3.5 shrink-0 text-muted-foreground/40" />
        )}
      </span>
      <div className="min-w-0">
        <span className={included ? "text-foreground" : "text-muted-foreground/50"}>
          {label}
        </span>
        {detail && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
    </li>
  );
}
