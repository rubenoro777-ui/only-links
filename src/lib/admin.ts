import type { Profile } from "@/lib/database.types";
import { isPro } from "./pro";

export const PREVIEW_PLAN_COOKIE = "ol_preview_plan";

export type PreviewPlan = "owner" | "free";

export function getOwnerEmails(): ReadonlySet<string> {
  const raw = process.env.ONLYLINKS_OWNER_EMAILS ?? "";
  return new Set(
    raw.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
  );
}

export function getOwnerHandles(): ReadonlySet<string> {
  const raw = process.env.ONLYLINKS_OWNER_HANDLES ?? "";
  return new Set(
    raw.split(",").map((handle) => handle.trim().toLowerCase()).filter(Boolean),
  );
}

export function isAppOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return getOwnerEmails().has(email.trim().toLowerCase());
}

export function isOwnerAccount(options: {
  email?: string | null;
  handle?: string | null;
}): boolean {
  if (options.email && isAppOwner(options.email)) return true;
  if (options.handle) {
    return getOwnerHandles().has(options.handle.trim().toLowerCase());
  }
  return false;
}

export function readPreviewPlan(cookieValue: string | undefined): PreviewPlan {
  return cookieValue === "free" ? "free" : "owner";
}

export function hasProAccess(options: {
  profile: Pick<Profile, "subscription_status" | "handle">;
  email: string | null | undefined;
  previewPlan: PreviewPlan;
}): boolean {
  if (isPro(options.profile)) return true;
  if (
    isOwnerAccount({ email: options.email, handle: options.profile.handle }) &&
    options.previewPlan !== "free"
  ) {
    return true;
  }
  return false;
}

export function effectiveSubscriptionStatus(options: {
  profile: Pick<Profile, "subscription_status" | "handle">;
  email: string | null | undefined;
  previewPlan: PreviewPlan;
}): "free" | "pro" {
  return hasProAccess(options) ? "pro" : "free";
}

export type PlanAccess = {
  isOwner: boolean;
  previewPlan: PreviewPlan;
  hasProAccess: boolean;
  isProSubscriber: boolean;
};
