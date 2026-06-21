import type { PublicSupabaseClient } from "@/lib/supabase/types";

export type AccessGrant = {
  access_token: string;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
};

export const HANDOFF_TTL_MS = 30 * 60 * 1000;
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function createGrantFields(now = new Date()): Pick<
  AccessGrant,
  "access_token" | "expires_at"
> {
  return {
    access_token: generateAccessToken(),
    expires_at: new Date(now.getTime() + HANDOFF_TTL_MS).toISOString(),
  };
}

export function generateAccessToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isHandoffGrantValid(grant: AccessGrant, now: Date): boolean {
  if (grant.revoked_at) return false;
  if (grant.redeemed_at) return false;
  return new Date(grant.expires_at).getTime() > now.getTime();
}

export function isCookieGrantValid(grant: AccessGrant): boolean {
  if (grant.revoked_at) return false;
  return grant.redeemed_at !== null;
}

export function accessCookieName(linkId: string): string {
  return `ol_access_${linkId}`;
}

export function buildHandoffPath(linkId: string, accessToken: string): string {
  return `/l/${linkId}?t=${encodeURIComponent(accessToken)}`;
}

export function readAccessCookie(
  cookies: { get(name: string): { value: string } | undefined },
  linkId: string,
): string | null {
  const value = cookies.get(accessCookieName(linkId))?.value ?? null;
  return value && value.trim() ? value.trim() : null;
}

export function accessCookieOptions(linkId: string) {
  return {
    name: accessCookieName(linkId),
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: `/l/${linkId}`,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export async function redeemHandoffToken(
  supabase: PublicSupabaseClient,
  linkId: string,
  accessToken: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("redeem_link_access_token", {
    p_link_id: linkId,
    p_access_token: accessToken,
  });

  if (error) {
    console.error("redeem_link_access_token RPC failed:", error.message);
    return false;
  }

  return data === true;
}

export async function validateAccessCookie(
  supabase: PublicSupabaseClient,
  linkId: string,
  accessToken: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("validate_link_access_cookie", {
    p_link_id: linkId,
    p_access_token: accessToken,
  });

  if (error) {
    console.error("validate_link_access_cookie RPC failed:", error.message);
    return false;
  }

  return data === true;
}

export async function getAccessTokenForSession(
  supabase: PublicSupabaseClient,
  stripeSessionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("link_unlocks")
    .select("access_token")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    console.error("getAccessTokenForSession failed:", error.message);
    return null;
  }

  return data?.access_token ?? null;
}

export async function getAccessTokenForVisitor(
  supabase: PublicSupabaseClient,
  linkId: string,
  visitorId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_link_access_token_for_visitor", {
    p_link_id: linkId,
    p_visitor_id: visitorId,
  });

  if (error) {
    console.error("get_link_access_token_for_visitor RPC failed:", error.message);
    return null;
  }

  return typeof data === "string" && data ? data : null;
}
