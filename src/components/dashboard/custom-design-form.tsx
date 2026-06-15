"use client";

import { useActionState } from "react";
import { updateCustomDesign } from "@/actions/profile";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/actions/types";
import type { Profile } from "@/lib/database.types";

const FONT_OPTIONS = [
  { value: "", label: "Default (system UI)" },
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "Lato", label: "Lato" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Raleway", label: "Raleway" },
  { value: "Roboto Mono", label: "Roboto Mono" },
];

interface Props {
  profile: Pick<Profile, "custom_bg" | "custom_accent" | "custom_text" | "custom_font" | "custom_css">;
}

export function CustomDesignForm({ profile }: Props) {
  const [state, formAction] = useActionState(updateCustomDesign, initialActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ColorField
          id="custom_bg"
          label="Background"
          defaultValue={profile.custom_bg ?? ""}
          hint="Any CSS value: #hex, rgb(), gradient…"
        />
        <ColorField
          id="custom_accent"
          label="Button colour"
          defaultValue={profile.custom_accent ?? ""}
          hint="Link button background"
        />
        <ColorField
          id="custom_text"
          label="Text colour"
          defaultValue={profile.custom_text ?? ""}
          hint="Page body text"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="custom_font" className="text-sm">Font</Label>
        <select
          id="custom_font"
          name="custom_font"
          defaultValue={profile.custom_font ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Loaded via Google Fonts on your public page.</p>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
          Advanced: custom CSS
        </summary>
        <div className="mt-3 space-y-1.5">
          <Textarea
            id="custom_css"
            name="custom_css"
            defaultValue={profile.custom_css ?? ""}
            placeholder={`.ol-link { border-radius: 0; }\n.ol-page { font-size: 15px; }`}
            rows={6}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Injected after the theme styles. Use <code className="font-mono">.ol-page</code>,{" "}
            <code className="font-mono">.ol-link</code>, <code className="font-mono">.ol-avatar</code>, etc.
          </p>
        </div>
      </details>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Saved!</p>}

      <div className="flex items-center gap-3">
        <SubmitButton size="sm">Save design</SubmitButton>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            (["custom_bg", "custom_accent", "custom_text", "custom_font", "custom_css"] as const).forEach(
              (id) => {
                const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
                if (el) el.value = "";
              }
            );
          }}
        >
          Reset to theme defaults
        </Button>
      </div>
    </form>
  );
}

function ColorField({
  id,
  label,
  defaultValue,
  hint,
}: {
  id: string;
  label: string;
  defaultValue: string;
  hint: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          className="h-9 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
          onChange={(e) => {
            const text = document.getElementById(id) as HTMLInputElement | null;
            if (text) text.value = e.target.value;
          }}
        />
        <Input
          id={id}
          name={id}
          defaultValue={defaultValue}
          placeholder="#ffffff or linear-gradient(…)"
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
