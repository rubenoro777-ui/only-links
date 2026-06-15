import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a user-entered URL into something safe to put in an href.
 * Defaults to https:// when no protocol is present. Returns null for
 * unsupported / dangerous schemes (e.g. javascript:).
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Reduces a URL to a comparable canonical key: lowercased host without a
 * leading "www.", path without trailing slashes, plus query string; protocol
 * is ignored. Used to detect when two links point at the same destination
 * (e.g. a public social icon vs a paywalled link). Returns null if unparseable.
 */
export function canonicalizeUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;
  try {
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    return `${host}${path}${u.search}`.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Sanitizes a user-supplied value before it is injected into an inline
 * `<style>` block. The content of a <style> element is raw text terminated by
 * the `</style` token, so any angle bracket lets an attacker close the element
 * and inject `<script>` - a stored XSS. CSS values never legitimately need
 * angle brackets, so we strip them entirely and cap the length. Returns null
 * for empty/non-string input.
 */
export function sanitizeCssValue(
  raw: string | null | undefined,
  maxLen = 2000,
): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[<>]/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLen) : null;
}

/**
 * Defense-in-depth backstop for a fully-assembled inline stylesheet string.
 * Neutralises any residual `</style` / `<style` token (in any tokenizer form,
 * e.g. `</style >`, `</style\n>`) so it can never break out of the element,
 * even for data persisted before write-time sanitization existed.
 */
export function neutralizeStyleBreakout(css: string): string {
  return css.replace(/<\s*\/?\s*style/gi, "");
}

/**
 * Constrains a post-auth `next` redirect target to an internal, same-origin
 * path. Rejects absolute URLs (`https://evil.com`), protocol-relative URLs
 * (`//evil.com`), and backslash tricks (`/\\evil.com`) that browsers may treat
 * as external, falling back to `/dashboard`. Prevents open-redirect abuse.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/")) return fallback;
  // Reject protocol-relative (`//host`) and backslash-escaped variants.
  if (raw.startsWith("//") || raw.startsWith("/\\") || raw.startsWith("/%2f")) {
    return fallback;
  }
  return raw;
}
