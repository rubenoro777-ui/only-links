"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { claimHandleSchema, profileSchema, socialsSchema } from "@/lib/validations";
import { getThemeAccess, isThemeId } from "@/lib/themes";
import { normalizeSocial, MAX_SOCIALS, type SocialLink } from "@/lib/socials";
import { sanitizeCssValue } from "@/lib/utils";
import type { ActionState } from "@/actions/types";
import { revalidateDashboardPaths } from "@/actions/_shared";

export async function claimHandle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = claimHandleSchema.safeParse({
    handle: formData.get("handle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid handle." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    handle: parsed.data.handle,
    display_name:
      (user.user_metadata?.full_name as string | undefined) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That handle is already taken. Try another." };
    }
    return { error: "Could not claim that handle. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const rawAvatar = formData.get("avatar_url");
  let avatarUrl: string | null | undefined = undefined;
  if (typeof rawAvatar === "string") {
    if (rawAvatar === "") {
      avatarUrl = null;
    } else {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      if (!rawAvatar.startsWith(`${base}/storage/v1/object/public/avatars/`)) {
        return { error: "Invalid avatar reference." };
      }
      avatarUrl = rawAvatar;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  await revalidateDashboardPaths(profile?.handle);
  return { success: true };
}

export async function updateSocials(
  socials: unknown,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = socialsSchema.safeParse(socials);
  if (!parsed.success) return { error: "Invalid social links." };

  const cleaned: SocialLink[] = [];
  for (const entry of parsed.data) {
    const ok = normalizeSocial(entry);
    if (ok) cleaned.push(ok);
    if (cleaned.length >= MAX_SOCIALS) break;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ socials: cleaned })
    .eq("id", user.id);
  if (error) return { error: "Could not save your social links. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  await revalidateDashboardPaths(profile?.handle);
  return { success: true };
}

export async function updateCustomDesign(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  // Strip angle brackets so user-supplied values can never break out of the
  // inline <style> block on the public page (stored-XSS prevention). The short
  // design fields get a tight cap; custom CSS is allowed to be longer.
  const { error } = await supabase
    .from("profiles")
    .update({
      custom_bg: sanitizeCssValue(raw("custom_bg"), 200),
      custom_accent: sanitizeCssValue(raw("custom_accent"), 200),
      custom_text: sanitizeCssValue(raw("custom_text"), 200),
      custom_font: sanitizeCssValue(raw("custom_font"), 100),
      custom_css: sanitizeCssValue(raw("custom_css"), 5000),
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save your design. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  await revalidateDashboardPaths(profile?.handle);
  return { success: true };
}

export async function updateTheme(themeId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!isThemeId(themeId)) return { error: "Unknown theme." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, subscription_status")
    .eq("id", user.id)
    .maybeSingle();
  const access = getThemeAccess({
    themeId,
    subscriptionStatus: profile?.subscription_status,
  });
  if (!access.allowed) return { error: access.reason };

  const { error } = await supabase
    .from("profiles")
    .update({ theme: themeId })
    .eq("id", user.id);
  if (error) return { error: "Could not save the theme. Please try again." };

  await revalidateDashboardPaths(profile?.handle);
  return { success: true };
}

export async function updateCustomDomain(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = formData.get("custom_domain");
  let domain: string | null = null;
  if (typeof raw === "string" && raw.trim()) {
    // Strip protocol if pasted with it, lowercase, strip trailing slash
    domain = raw.trim().replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    // Basic validation: must look like a domain
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return { error: "Enter a valid domain like links.yoursite.com" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ custom_domain: domain })
    .eq("id", user.id);
  if (error) return { error: "Could not save your domain. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  await revalidateDashboardPaths(profile?.handle);
  return { success: true };
}
