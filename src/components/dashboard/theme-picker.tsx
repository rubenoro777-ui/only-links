"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import {
  getThemeAccess,
  THEMES,
  type Theme,
  type ThemeSceneLayer,
} from "@/lib/themes";
import { updateTheme } from "@/actions/profile";
import { cn } from "@/lib/utils";

const THEME_COLLECTIONS = Array.from(new Set(THEMES.map((theme) => theme.collection))).map(
  (collection) => ({
    collection,
    themes: THEMES.filter((theme) => theme.collection === collection),
  }),
);

export function ThemePicker({ current, isPro }: { current: string; isPro: boolean }) {
  const [selected, setSelected] = useState(current);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(id: string) {
    if (id === selected) return;
    const access = getThemeAccess({
      themeId: id,
      subscriptionStatus: isPro ? "pro" : "free",
    });
    if (!access.allowed) {
      setError(access.reason);
      return;
    }
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
      {THEME_COLLECTIONS.map(({ collection, themes }) => (
        <section key={collection} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {collection}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {themes.map((theme) => {
              const active = selected === theme.id;
              const locked = !getThemeAccess({
                themeId: theme.id,
                subscriptionStatus: isPro ? "pro" : "free",
              }).allowed;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => choose(theme.id)}
                  disabled={isPending}
                  aria-pressed={active}
                  aria-label={`${locked ? "Upgrade to Pro to unlock" : "Apply"} ${theme.name}: ${theme.description}`}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 bg-card text-left transition disabled:opacity-70",
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : locked
                        ? "border-transparent opacity-75 hover:border-primary/30"
                        : "border-transparent hover:border-muted-foreground/30",
                  )}
                >
                  <ThemeSwatch theme={theme} />
                  <div className="space-y-1 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{theme.name}</span>
                      {active ? (
                        <Check className="size-3.5 shrink-0 text-primary" />
                      ) : locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-primary">
                          <Lock className="size-2.5" />
                          Pro
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-[0.68rem] leading-tight text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {error ? (
        <p className="text-sm text-destructive">
          {error}{" "}
          {error.includes("Pro") && (
            <Link href="/dashboard/billing" className="font-medium underline underline-offset-4">
              View plans
            </Link>
          )}
        </p>
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
      className="relative flex h-24 flex-col items-center justify-center gap-1.5 overflow-hidden px-3"
      style={{ background: theme.background }}
    >
      {theme.scene?.before && <ScenePreviewLayer layer={theme.scene.before} />}
      {theme.scene?.after && <ScenePreviewLayer layer={theme.scene.after} />}
      <div
        className="relative z-10 mb-0.5 size-5 rounded-full"
        style={{ background: theme.buttonBg, boxShadow: `0 0 0 2px ${theme.ring}` }}
      />
      <div className="relative z-10 h-3 w-full" style={barStyle} />
      <div className="relative z-10 h-3 w-full" style={barStyle} />
    </div>
  );
}

function ScenePreviewLayer({ layer }: { layer: ThemeSceneLayer }) {
  const style: CSSProperties = {
    ...layer,
    position: "absolute",
    animation: "none",
    zIndex: 0,
  };

  return <span aria-hidden="true" style={style} />;
}
