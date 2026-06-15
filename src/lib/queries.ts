import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Link, LinkSection, Profile } from "@/lib/database.types";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export const getPublicProfileByHandle = cache(async (
  handle: string,
): Promise<{ profile: Profile; links: Link[]; sections: LinkSection[] } | null> => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (!profile) return null;

  const [{ data: links }, { data: sections }] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("profile_id", profile.id)
      .is("archived_at", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("link_sections")
      .select("*")
      .eq("profile_id", profile.id)
      .order("position", { ascending: true }),
  ]);

  return { profile, links: links ?? [], sections: sections ?? [] };
});
