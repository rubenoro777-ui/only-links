"use client";

import { useActionState } from "react";
import { updateCustomDomain } from "@/actions/profile";
import { initialActionState } from "@/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function CustomDomainForm({ currentDomain }: { currentDomain: string | null }) {
  const [state, formAction] = useActionState(updateCustomDomain, initialActionState);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="custom_domain" className="text-sm">Your domain</Label>
          <Input
            id="custom_domain"
            name="custom_domain"
            defaultValue={currentDomain ?? ""}
            placeholder="links.yoursite.com"
            inputMode="url"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Enter a subdomain you control, e.g. <code className="font-mono">links.yourname.com</code>.
            Leave blank to use your {" "}
            <span className="font-mono">onlylinks.vercel.app</span> URL.
          </p>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">Saved!</p>}
        <SubmitButton size="sm">Save domain</SubmitButton>
      </form>

      {/* DNS instructions */}
      {currentDomain && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">DNS setup</p>
          <p className="text-xs text-muted-foreground">
            Add the following record in your DNS provider (Cloudflare, Namecheap, etc.):
          </p>
          <div className="rounded-md border bg-background p-3 font-mono text-xs space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-muted-foreground text-[10px] uppercase tracking-wide mb-2">
              <span>Type</span><span>Name</span><span>Value</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span>CNAME</span>
              <span className="truncate">{currentDomain.split(".").slice(0, -2).join(".") || currentDomain}</span>
              <span className="truncate">cname.vercel-dns.com</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Then add <code className="font-mono">{currentDomain}</code> as a custom domain in your Vercel project settings.
            DNS changes can take up to 24 hours to propagate.
          </p>
        </div>
      )}
    </div>
  );
}
