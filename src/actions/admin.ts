"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isAppOwner,
  PREVIEW_PLAN_COOKIE,
  type PreviewPlan,
} from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function setPreviewPlan(plan: PreviewPlan): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAppOwner(user.email)) redirect("/dashboard");

  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_PLAN_COOKIE, plan, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
}
