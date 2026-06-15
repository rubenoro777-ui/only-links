"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function revalidateDashboardPaths(handle?: string | null) {
  revalidatePath("/dashboard");
  if (handle) revalidatePath(`/${handle}`);
}

export async function revalidateForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", userId)
    .maybeSingle();
  await revalidateDashboardPaths(data?.handle);
}
