"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeAccessTtlMinutes } from "@/lib/access-grants";
import { linkSchema, reorderSchema } from "@/lib/validations";
import { normalizeUrl } from "@/lib/utils";
import type { ActionState } from "@/actions/types";
import { requireUser, revalidateForUser } from "@/actions/_shared";

export async function createLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const parsed = linkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const url = normalizeUrl(parsed.data.url);
  if (!url) return { error: "Enter a valid http(s) URL." };

  const { data: lastRow } = await supabase
    .from("links")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = lastRow as { position: number } | null;
  const nextPosition = (last?.position ?? -1) + 1;

  const { error } = await supabase.from("links").insert({
    profile_id: user.id,
    title: parsed.data.title,
    url,
    position: nextPosition,
  });
  if (error) return { error: "Could not add the link. Please try again." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function updateLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing link id." };

  const parsed = linkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const url = normalizeUrl(parsed.data.url);
  if (!url) return { error: "Enter a valid http(s) URL." };

  const isLocked = formData.get("is_locked") === "on";
  const priceDollars = formData.get("price_cents_dollars");
  const priceCents =
    isLocked && priceDollars
      ? Math.round(parseFloat(priceDollars as string) * 100)
      : null;

  const rawSectionId = formData.get("section_id");
  const sectionId =
    typeof rawSectionId === "string" && rawSectionId ? rawSectionId : null;
  const accessTtlMinutes = isLocked
    ? normalizeAccessTtlMinutes(formData.get("access_ttl_minutes"))
    : undefined;

  const { error } = await supabase
    .from("links")
    .update({
      title: parsed.data.title,
      url,
      is_locked: isLocked,
      price_cents: priceCents,
      ...(accessTtlMinutes !== undefined
        ? { access_ttl_minutes: accessTtlMinutes }
        : {}),
      section_id: sectionId,
    })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not save the link. Please try again." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function deleteLink(linkId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!linkId) return { error: "Missing link id." };

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not delete the link." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function setLinkLocked(
  linkId: string,
  isLocked: boolean,
  priceCents: number | null,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!linkId) return { error: "Missing link id." };

  const { error } = await supabase
    .from("links")
    .update({ is_locked: isLocked, price_cents: priceCents })
    .eq("id", linkId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not update the link." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function archiveLink(linkId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!linkId) return { error: "Missing link id." };

  const { error } = await supabase
    .from("links")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not archive the link." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function restoreLink(linkId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!linkId) return { error: "Missing link id." };

  const { error } = await supabase
    .from("links")
    .update({ archived_at: null })
    .eq("id", linkId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not restore the link." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function reorderLinks(
  orderedIds: string[],
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const parsed = reorderSchema.safeParse({ orderedIds });
  if (!parsed.success) return { error: "Invalid order." };

  const updates = parsed.data.orderedIds.map((id, index) =>
    supabase
      .from("links")
      .update({ position: index })
      .eq("id", id)
      .eq("profile_id", user.id),
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) {
    return { error: "Could not save the new order." };
  }

  await revalidateForUser(user.id);
  return { success: true };
}
