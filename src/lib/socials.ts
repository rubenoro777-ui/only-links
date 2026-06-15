/**
 * Social-icon links for public profile pages.
 *
 * A profile stores an array of { platform, url } in `profiles.socials` (jsonb).
 * This module is the single source of truth for which platforms exist, how each
 * is labelled, which icon represents it, and how a stored value becomes a real
 * href. It is imported by both Server Components (public page) and Client
 * Components (dashboard editor), so it must stay free of server-only APIs.
 */

import {
  Instagram,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  Facebook,
  Twitch,
  Music2,
  AtSign,
  Mail,
  Globe,
  Send,
  type LucideIcon,
} from "lucide-react";

export type SocialLink = {
  platform: string;
  url: string;
};

export type Platform = {
  id: string;
  label: string;
  Icon: LucideIcon;
  /** Shown as the input placeholder in the editor. */
  placeholder: string;
  /** "url" → must be an http(s) link; "email" → mailto; "text" → handle/number. */
  kind: "url" | "email";
};

export const PLATFORMS: Platform[] = [
  { id: "instagram", label: "Instagram", Icon: Instagram, kind: "url", placeholder: "https://instagram.com/you" },
  { id: "x", label: "X (Twitter)", Icon: Twitter, kind: "url", placeholder: "https://x.com/you" },
  { id: "tiktok", label: "TikTok", Icon: Music2, kind: "url", placeholder: "https://tiktok.com/@you" },
  { id: "youtube", label: "YouTube", Icon: Youtube, kind: "url", placeholder: "https://youtube.com/@you" },
  { id: "threads", label: "Threads", Icon: AtSign, kind: "url", placeholder: "https://threads.net/@you" },
  { id: "github", label: "GitHub", Icon: Github, kind: "url", placeholder: "https://github.com/you" },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin, kind: "url", placeholder: "https://linkedin.com/in/you" },
  { id: "facebook", label: "Facebook", Icon: Facebook, kind: "url", placeholder: "https://facebook.com/you" },
  { id: "twitch", label: "Twitch", Icon: Twitch, kind: "url", placeholder: "https://twitch.tv/you" },
  { id: "telegram", label: "Telegram", Icon: Send, kind: "url", placeholder: "https://t.me/you" },
  { id: "website", label: "Website", Icon: Globe, kind: "url", placeholder: "https://example.com" },
  { id: "email", label: "Email", Icon: Mail, kind: "email", placeholder: "you@example.com" },
];

export const PLATFORM_IDS: string[] = PLATFORMS.map((p) => p.id);

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function isPlatformId(id: string): boolean {
  return PLATFORM_IDS.includes(id);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and normalize one entry. Returns a cleaned SocialLink or null if it
 * should be dropped (unknown platform, empty/invalid value).
 */
export function normalizeSocial(input: {
  platform?: unknown;
  url?: unknown;
}): SocialLink | null {
  const platform = typeof input.platform === "string" ? input.platform.trim() : "";
  let url = typeof input.url === "string" ? input.url.trim() : "";
  if (!isPlatformId(platform) || url.length === 0 || url.length > 400) return null;

  const def = getPlatform(platform)!;
  if (def.kind === "email") {
    if (!EMAIL_RE.test(url)) return null;
  } else {
    // Add a scheme if the user typed a bare domain, then require http(s).
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      url = parsed.toString();
    } catch {
      return null;
    }
  }
  return { platform, url };
}

/** Parse the raw jsonb value from the DB into a clean, capped list. */
export function parseSocials(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  const out: SocialLink[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const cleaned = normalizeSocial(item as Record<string, unknown>);
      if (cleaned) out.push(cleaned);
    }
    if (out.length >= MAX_SOCIALS) break;
  }
  return out;
}

export const MAX_SOCIALS = 12;

/** Turn a stored social into a usable href. */
export function hrefFor(social: SocialLink): string {
  const def = getPlatform(social.platform);
  if (def?.kind === "email") return `mailto:${social.url}`;
  return social.url;
}
