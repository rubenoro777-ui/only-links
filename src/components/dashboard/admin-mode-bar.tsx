"use client";

import { useTransition } from "react";
import { Shield } from "lucide-react";
import { setPreviewPlan } from "@/actions/admin";
import type { PreviewPlan } from "@/lib/admin";
import { Button } from "@/components/ui/button";

type Props = {
  previewPlan: PreviewPlan;
  hasProAccess: boolean;
  isProSubscriber: boolean;
};

export function AdminModeBar({
  previewPlan,
  hasProAccess,
  isProSubscriber,
}: Props) {
  const [pending, startTransition] = useTransition();

  function select(plan: PreviewPlan) {
    startTransition(() => {
      void setPreviewPlan(plan);
    });
  }

  const modeLabel =
    previewPlan === "free"
      ? "Previewing as Free user"
      : hasProAccess
        ? isProSubscriber
          ? "Pro subscriber"
          : "Owner access (Pro features unlocked)"
        : "Owner access";

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Shield className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span className="font-medium text-amber-950 dark:text-amber-100">
            Admin mode
          </span>
          <span className="truncate text-xs text-amber-900/70 dark:text-amber-200/70">
            {modeLabel}
          </span>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-amber-500/25 bg-background/80 p-0.5">
          <Button
            type="button"
            size="sm"
            variant={previewPlan === "owner" ? "default" : "ghost"}
            className="h-7 px-2.5 text-xs"
            disabled={pending || previewPlan === "owner"}
            onClick={() => select("owner")}
          >
            Pro access
          </Button>
          <Button
            type="button"
            size="sm"
            variant={previewPlan === "free" ? "default" : "ghost"}
            className="h-7 px-2.5 text-xs"
            disabled={pending || previewPlan === "free"}
            onClick={() => select("free")}
          >
            Free preview
          </Button>
        </div>
      </div>
    </div>
  );
}
