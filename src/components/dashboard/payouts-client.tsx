"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PLATFORM_FEE_BPS_FREE,
  DEFAULT_PLATFORM_FEE_BPS_PRO,
  formatPlatformFeePercent,
} from "@/lib/stripe-connect";

type ConnectStatusResponse = {
  ready?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  subscriptionTier?: "free" | "pro";
  platformFeePercent?: string;
  platformFeeBpsFree?: number;
  platformFeeBpsPro?: number;
  error?: string;
};

export function PayoutsClient({
  stripeConfigured,
  isPro,
}: {
  stripeConfigured: boolean;
  isPro: boolean;
}) {
  const [status, setStatus] = useState<ConnectStatusResponse | null>(null);
  const [loading, setLoading] = useState<"status" | "onboard" | null>("status");
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading("status");
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/status");
      const data = (await res.json()) as ConnectStatusResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not load payout status.");
        return;
      }
      setStatus(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleConnect() {
    setLoading("onboard");
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not start Stripe Connect onboarding.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const freeFee = formatPlatformFeePercent(
    status?.platformFeeBpsFree ?? DEFAULT_PLATFORM_FEE_BPS_FREE,
  );
  const proFee = formatPlatformFeePercent(
    status?.platformFeeBpsPro ?? DEFAULT_PLATFORM_FEE_BPS_PRO,
  );
  const currentFee = status?.platformFeePercent ?? (isPro ? proFee : freeFee);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Wallet className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-semibold">Creator payouts</h2>
            <p className="text-sm text-muted-foreground">
              Connect Stripe to receive unlock payments from your locked links.
              OnlyLinks keeps a platform fee; the rest goes to you.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Free plan fee</p>
          <p className="mt-1 text-2xl font-bold">{freeFee}</p>
          <p className="mt-1 text-sm text-muted-foreground">Per locked-link unlock</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pro plan fee</p>
          <p className="mt-1 text-2xl font-bold">{proFee}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPro ? "Your current rate" : "Upgrade to keep more per sale"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Stripe Connect status</p>
            <p className="text-sm text-muted-foreground">
              {loading === "status"
                ? "Checking payout setup…"
                : status?.ready
                  ? `Ready to accept payments · your fee is ${currentFee}`
                  : status?.detailsSubmitted
                    ? "Stripe is reviewing your account"
                    : "Not connected yet"}
            </p>
          </div>
          {status?.ready && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              Active
            </span>
          )}
        </div>

        {!isPro && (
          <p className="text-sm text-muted-foreground">
            You can monetize links on the free plan.{" "}
            <Link href="/dashboard/billing" className="font-medium text-foreground underline-offset-4 hover:underline">
              Upgrade to Pro
            </Link>{" "}
            to drop your platform fee from {freeFee} to {proFee}.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {stripeConfigured ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleConnect()}
              disabled={loading !== null}
            >
              {loading === "onboard" && <Loader2 className="size-4 animate-spin" />}
              {status?.ready ? "Update payout details" : "Connect Stripe payouts"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadStatus()}
              disabled={loading !== null}
            >
              Refresh status
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Stripe is not configured on this deployment yet.
          </p>
        )}
      </div>
    </div>
  );
}
