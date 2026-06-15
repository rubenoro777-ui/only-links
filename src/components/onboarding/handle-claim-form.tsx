"use client";

import { useActionState, useState } from "react";
import { claimHandle } from "@/actions/profile";
import { initialActionState } from "@/actions/types";
import { getSiteUrl } from "@/lib/site";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function HandleClaimForm() {
  const [state, formAction] = useActionState(claimHandle, initialActionState);
  const [handle, setHandle] = useState("");
  const host = getSiteUrl().replace(/^https?:\/\//, "");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="handle">Choose your handle</Label>
        <Input
          id="handle"
          name="handle"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="yourname"
          value={handle}
          onChange={(e) =>
            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          maxLength={30}
          required
        />
        <p className="text-sm text-muted-foreground">
          {host}/<span className="font-medium text-foreground">{handle || "yourname"}</span>
        </p>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
      <SubmitButton className="w-full" pendingText="Claiming…">
        Claim handle
      </SubmitButton>
    </form>
  );
}
