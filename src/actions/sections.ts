"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/actions/types";
import { requireUser, revalidateForUser } from "@/actions/_shared";

export async function createSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Section title is required." };
  }

  const { data: last } = await supabase
    .from("link_sections")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((last as { position: number } | null)?.position ?? -1) + 1;

  const { error } = await supabase.from("link_sections").insert({
    profile_id: user.id,
    title: title.trim(),
    position: nextPosition,
  });
  if (error) return { error: "Could not create the section. Please try again." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function renameSection(
  sectionId: string,
  title: string,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  if (!title.trim()) return { error: "Section title is required." };

  const { error } = await supabase
    .from("link_sections")
    .update({ title: title.trim() })
    .eq("id", sectionId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not rename the section." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function setSectionCollapsed(
  sectionId: string,
  collapsed: boolean,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("link_sections")
    .update({ collapsed_by_default: collapsed })
    .eq("id", sectionId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not update the section." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function deleteSection(sectionId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("link_sections")
    .delete()
    .eq("id", sectionId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not delete the section." };

  await revalidateForUser(user.id);
  return { success: true };
}

export async function reorderSections(
  orderedIds: string[],
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: "Invalid order." };
  }

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("link_sections")
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

export async function assignLinkSection(
  linkId: string,
  sectionId: string | null,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("links")
    .update({ section_id: sectionId })
    .eq("id", linkId)
    .eq("profile_id", user.id);
  if (error) return { error: "Could not update the link's section." };

  await revalidateForUser(user.id);
  return { success: true };
}
