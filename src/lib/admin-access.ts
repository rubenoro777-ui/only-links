import { cookies } from "next/headers";
import type { Profile } from "@/lib/database.types";
import {
  hasProAccess,
  isOwnerAccount,
  readPreviewPlan,
  PREVIEW_PLAN_COOKIE,
  type PlanAccess,
} from "@/lib/admin";

export async function getPlanAccess(
  profile: Profile,
  email: string | null | undefined,
): Promise<PlanAccess> {
  const cookieStore = await cookies();
  const previewPlan = readPreviewPlan(
    cookieStore.get(PREVIEW_PLAN_COOKIE)?.value,
  );
  const isOwner = isOwnerAccount({ email, handle: profile.handle });
  const isProSubscriber = profile.subscription_status === "pro";
  const pro = hasProAccess({ profile, email, previewPlan });

  return {
    isOwner,
    previewPlan,
    hasProAccess: pro,
    isProSubscriber,
  };
}
