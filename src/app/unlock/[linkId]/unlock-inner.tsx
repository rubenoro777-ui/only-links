"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ linkId: string }>;
}

export function UnlockPageInner({ params }: Props) {
  const [linkId, setLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<{
    title: string;
    price_cents: number;
    handle: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    params.then(({ linkId: id }) => setLinkId(id));
  }, [params]);

  useEffect(() => {
    if (!linkId) return;
    fetch(`/api/stripe/link-info?linkId=${linkId}`)
      .then((r) => r.json())
      .then((data) => {
        if ((data as { error?: string }).error) setError((data as { error: string }).error);
        else setLinkData(data as typeof linkData);
      })
      .catch(() => setError("Failed to load link information."));
  }, [linkId]);

  useEffect(() => {
    if (!linkId || sessionId) return;
    setCheckingUnlock(true);
    fetch(`/api/stripe/unlock-status?linkId=${linkId}`)
      .then((r) => r.json())
      .then((data) => {
        const status = data as { unlocked?: boolean; redirectTo?: string };
        if (status.unlocked && status.redirectTo) {
          router.replace(status.redirectTo);
        }
      })
      .catch(() => { /* stay on paywall */ })
      .finally(() => setCheckingUnlock(false));
  }, [linkId, sessionId, router]);

  useEffect(() => {
    if (!sessionId || !linkId) return;
    setCheckingUnlock(true);
    fetch(`/api/stripe/verify?session_id=${sessionId}&link_id=${linkId}`)
      .then((r) => r.json())
      .then((data) => {
        const result = data as { redirectTo?: string; error?: string };
        if (result.redirectTo) {
          router.replace(result.redirectTo);
        } else {
          setError(result.error ?? "Payment verified but could not redirect. Please try again.");
          setCheckingUnlock(false);
        }
      })
      .catch(() => {
        setError("Could not verify payment. Contact support.");
        setCheckingUnlock(false);
      });
  }, [sessionId, linkId, router]);

  async function handlePay() {
    if (!linkId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "link_unlock", linkId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (checkingUnlock) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying payment…</p>
        </div>
      </div>
    );
  }

  const price = linkData
    ? `$${(linkData.price_cents / 100).toFixed(2)}`
    : null;

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Lock className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">
            {linkData ? linkData.title : "Locked link"}
          </h1>
          {price && (
            <p className="text-sm text-muted-foreground">
              One-time unlock · {price}
            </p>
          )}
        </div>

        {cancelled && !error && (
          <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
            Payment cancelled. You can try again below.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        {!error && (
          <Button
            className="w-full"
            onClick={handlePay}
            disabled={loading || !linkData}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Redirecting to payment…
              </>
            ) : price ? (
              `Unlock for ${price}`
            ) : (
              "Loading…"
            )}
          </Button>
        )}

        {linkData?.handle && (
          <p className="text-center text-xs text-muted-foreground">
            <a href={`/${linkData.handle}`} className="underline underline-offset-4">
              Back to profile
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
