/**
 * Returns the public base URL of the app. Prefers the explicit
 * NEXT_PUBLIC_SITE_URL, then Vercel's system env, then localhost.
 * Always returns a value without a trailing slash.
 */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined) ??
    "http://localhost:3000";
  return fromEnv.replace(/\/$/, "");
}

export const SITE_NAME = "OnlyLinks";
