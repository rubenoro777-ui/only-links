/**
 * Server-side analytics helpers.
 * No external dependencies — runs in the Edge / Node runtime.
 */

export interface ParsedUA {
  device_type: "mobile" | "tablet" | "desktop" | null;
  browser: string | null;
  os: string | null;
}

/**
 * Parse a User-Agent string into human-readable device, browser, and OS.
 * Best-effort — returns nulls for unknown values.
 */
export function parseUA(ua: string | null | undefined): ParsedUA {
  if (!ua) return { device_type: null, browser: null, os: null };

  // Device type — check tablet before mobile (iPad UA contains "Mobile" on some iOS)
  const isTablet = /tablet|ipad/i.test(ua);
  const isMobile = !isTablet && /mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua);
  const device_type: ParsedUA["device_type"] = isTablet
    ? "tablet"
    : isMobile
      ? "mobile"
      : "desktop";

  // Browser — order matters: Edge before Chrome (Edge UA includes "Chrome")
  let browser: string | null = null;
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome\/|chromium\//i.test(ua)) browser = "Chrome";
  else if (/firefox\/|fxios\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua)) browser = "Safari";
  else if (/msie |trident\//i.test(ua)) browser = "IE";

  // OS
  let os: string | null = null;
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "ChromeOS";

  return { device_type, browser, os };
}

/**
 * Derive a deterministic visitor fingerprint from IP + User-Agent.
 * Uses SHA-256 via the Web Crypto API (available in both Node 18+ and Edge).
 * Returns the first 16 hex chars — collision probability is negligible for
 * analytics purposes, and we never store the raw IP.
 */
export async function hashVisitorId(
  ip: string | null | undefined,
  ua: string | null | undefined,
): Promise<string | null> {
  if (!ip && !ua) return null;
  const raw = `${ip ?? ""}|${ua ?? ""}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 16);
}

/** Minimal header accessor — compatible with both Headers and ReadonlyHeaders. */
type HeaderGetter = { get(name: string): string | null };

/**
 * Extract the client IP from common reverse-proxy headers.
 * Vercel sets x-forwarded-for; the first entry is the original client IP.
 */
export function extractIp(headers: HeaderGetter): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    return first || null;
  }
  return headers.get("x-real-ip");
}
