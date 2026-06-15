"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanFeature } from "@/lib/pro";

interface Props {
  isPro: boolean;
  stripeConfigured: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  features: readonly PlanFeature[];
}

export function BillingClient({ isPro, stripeConfigured, monthlyPrice, yearlyPrice, features }: Props) {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [loading, setLoading] = useState<"upgrade" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthly = (monthlyPrice / 100).toFixed(0);
  const yearly  = (yearlyPrice  / 100).toFixed(0);
  const savePct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const displayPrice = interval === "month" ? monthly : (yearlyPrice / 100 / 12).toFixed(2);

  async function handleUpgrade() {
    setLoading("upgrade"); setError(null);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pro", interval }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not start checkout.");
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(null); }
  }

  async function handlePortal() {
    setLoading("portal"); setError(null);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not open billing portal.");
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(null); }
  }

  return (
    <div className="space-y-6">
      {/* Billing interval toggle */}
      {!isPro && (
        <div className="flex justify-center">
          <div className="flex rounded-lg border p-1 text-sm">
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
              <span className={[
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                interval === "year"
                  ? "bg-green-500 text-white"
                  : "bg-green-500/15 text-green-600",
              ].join(" ")}>
                -{savePct}%
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className={[
          "relative rounded-xl border p-5 space-y-4",
          !isPro ? "border-2 border-foreground/20 bg-background" : "bg-muted/30",
        ].join(" ")}>
          {!isPro && (
            <span className="absolute -top-2.5 left-4 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
              Current plan
            </span>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Free</p>
            <p className="mt-1 text-3xl font-bold">$0</p>
            <p className="text-xs text-muted-foreground mt-0.5">forever</p>
          </div>
          <ul className="space-y-2">
            {features.map((f) => (
              <FeatureRow key={f.label} label={f.label} value={f.free} />
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={[
          "relative rounded-xl border-2 p-5 space-y-4",
          isPro ? "border-primary bg-background" : "border-primary/40 bg-background",
        ].join(" ")}>
          {isPro ? (
            <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              Active
            </span>
          ) : (
            <span className="absolute -top-2.5 left-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Recommended
            </span>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pro</p>
            <div className="flex items-end gap-1 mt-1">
              <p className="text-3xl font-bold">${displayPrice}</p>
              <p className="text-sm text-muted-foreground mb-0.5">/mo</p>
            </div>
            {interval === "year" && !isPro && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Billed ${yearly}/yr · saves ${((monthlyPrice * 12 - yearlyPrice) / 100).toFixed(0)}/yr
              </p>
            )}
          </div>
          <ul className="space-y-2">
            {features.map((f) => (
              <FeatureRow key={f.label} label={f.label} value={f.pro} />
            ))}
          </ul>

          {stripeConfigured ? (
            isPro ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePortal}
                disabled={loading === "portal"}
              >
                {loading === "portal"
                  ? <><Loader2 className="mr-2 size-4 animate-spin" />Opening…</>
                  : "Manage subscription"}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleUpgrade}
                disabled={loading === "upgrade"}
              >
                {loading === "upgrade"
                  ? <><Loader2 className="mr-2 size-4 animate-spin" />Redirecting…</>
                  : `Upgrade to Pro · $${interval === "month" ? monthly + "/mo" : yearly + "/yr"}`}
              </Button>
            )
          ) : (
            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              Payments coming soon
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

function FeatureRow({ label, value }: { label: string; value: boolean | string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {value === false ? (
        <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
      ) : (
        <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
      )}
      <span className={value === false ? "text-muted-foreground/50" : ""}>
        {value === true || value === false ? label : (
          <>{label} <span className="font-medium text-foreground">({value})</span></>
        )}
      </span>
    </li>
  );
}
