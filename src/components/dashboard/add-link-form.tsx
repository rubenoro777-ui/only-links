"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLink } from "@/actions/links";
import { initialActionState } from "@/actions/types";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function AddLinkForm() {
  const [state, formAction] = useActionState(createLink, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2 rounded-lg border border-dashed p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="title" placeholder="Title (e.g. My Portfolio)" required />
        <Input
          name="url"
          placeholder="example.com"
          inputMode="url"
          required
        />
        <SubmitButton pendingText="Adding…" className="shrink-0">
          Add link
        </SubmitButton>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
