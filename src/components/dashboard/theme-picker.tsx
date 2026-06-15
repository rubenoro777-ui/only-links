"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { THEMES, type Theme } from "@/lib/themes";
import { updateTheme } from "@/actions/profile";
import { cn } from "@/lib/utils";

export function ThemePicker({ current }: { current: string }) {
  const [selected, setSelected] = useState(current);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(id: string) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id); // optimistic
    setError(null);
    startTransition(async () => {
      const res = await updateTheme(id);
      if (res?.error) {
        setSelected(previous); // revert on failure
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEMES.map((theme) => {
          const active = selected === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => choose(theme.id)}
              disabled={isPending}
              aria-pressed={active}
              className={cn(
                "overflow-hidden rounded-xl border-2 text-left transition disabled:opacity-70",
                active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30",
              )}
            >
              <ThemeSwatch theme={theme} />
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium">{theme.name}</span>
                {active && <Check className="size-3.5 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {isPending ? "Saving…" : "Tap a theme to apply it to your public page."}
        </p>
      )}
    </div>
  );
}

function ThemeSwatch({ theme }: { theme: Theme }) {
  const barStyle = {
    background: theme.buttonBg,
    border: theme.buttonBorder,
    borderRadius: theme.buttonRadius === "9999px" ? "9999px" : "5px",
    boxShadow: theme.buttonShadow,
  } as const;

  return (
    <div
      className="flex h-24 flex-col items-center justify-center gap-1.5 px-3"
      style={{ background: theme.background }}
    >
      <div
        className="mb-0.5 size-5 rounded-full"
        style={{ background: theme.buttonBg, boxShadow: `0 0 0 2px ${theme.ring}` }}
      />
      <div className="h-3 w-full" style={barStyle} />
      <div className="h-3 w-full" style={barStyle} />
    </div>
  );
}
