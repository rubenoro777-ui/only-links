"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PLATFORMS, MAX_SOCIALS, getPlatform, type SocialLink } from "@/lib/socials";
import { updateSocials } from "@/actions/profile";
import { canonicalizeUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { key: string; platform: string; url: string };

let keySeq = 0;
const nextKey = () => `r${keySeq++}`;

export function SocialsManager({
  initial,
  lockedDestinations = [],
}: {
  initial: SocialLink[];
  lockedDestinations?: string[];
}) {
  const lockedSet = new Set(lockedDestinations);
  const [rows, setRows] = useState<Row[]>(
    initial.map((s) => ({ key: nextKey(), platform: s.platform, url: s.url })),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: string, patch: Partial<Row>) {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setSaved(false);
    if (rows.length >= MAX_SOCIALS) return;
    // Default to the first platform not already used, else Instagram.
    const used = new Set(rows.map((r) => r.platform));
    const free = PLATFORMS.find((p) => !used.has(p.id)) ?? PLATFORMS[0];
    setRows((rs) => [...rs, { key: nextKey(), platform: free.id, url: "" }]);
  }

  function removeRow(key: string) {
    setSaved(false);
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  function save() {
    setError(null);
    setSaved(false);
    const payload = rows
      .map((r) => ({ platform: r.platform, url: r.url.trim() }))
      .filter((r) => r.url.length > 0);
    startTransition(async () => {
      const res = await updateSocials(payload);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No social icons yet. Add Instagram, TikTok, YouTube, and more — they
          appear as a row of icons under your name.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const def = getPlatform(row.platform);
            const collides =
              def?.kind !== "email" &&
              row.url.trim().length > 0 &&
              (() => {
                const c = canonicalizeUrl(row.url);
                return c !== null && lockedSet.has(c);
              })();
            return (
              <li key={row.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <select
                    value={row.platform}
                    onChange={(e) => update(row.key, { platform: e.target.value })}
                    className="h-10 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                    aria-label="Platform"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={row.url}
                    onChange={(e) => update(row.key, { url: e.target.value })}
                    placeholder={def?.placeholder ?? "https://…"}
                    inputMode={def?.kind === "email" ? "email" : "url"}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove"
                    className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {collides && (
                  <p className="pl-1 text-xs text-amber-600">
                    This points to the same destination as one of your locked
                    (paid) links, so it&apos;s hidden on your public page to
                    protect the paywall.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_SOCIALS}
        >
          <Plus className="mr-1.5 size-4" />
          Add icon
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save icons"}
        </Button>
        {saved && !error && (
          <span className="text-xs text-muted-foreground">Saved ✓</span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows.length >= MAX_SOCIALS && (
        <p className="text-xs text-muted-foreground">
          That&apos;s the max of {MAX_SOCIALS} icons.
        </p>
      )}
    </div>
  );
}
