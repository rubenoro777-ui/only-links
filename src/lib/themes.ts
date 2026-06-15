/**
 * Curated visual themes for public profile pages. Each theme is a flat set of
 * CSS values so it can be applied either as inline styles or rendered into a
 * scoped <style> block (the public page stays a Server Component, no client JS).
 *
 * The selected theme id is stored in `profiles.theme`.
 */

export type Theme = {
  id: string;
  name: string;
  /** CSS `background` for the page (supports gradients). */
  background: string;
  /** Primary text color. */
  text: string;
  /** Secondary / muted text color (bio, footer). */
  muted: string;
  /** Avatar ring color. */
  ring: string;
  /** Link button styles. */
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  buttonRadius: string;
  buttonShadow: string;
  buttonHoverBg: string;
  /** Optional: text color on hover (used by themes that invert on hover). */
  buttonHoverText?: string;
  /** Optional: backdrop-filter for frosted-glass buttons. */
  backdrop?: string;
};

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Clean",
    background: "#fafafa",
    text: "#09090b",
    muted: "#71717a",
    ring: "#e4e4e7",
    buttonBg: "#ffffff",
    buttonText: "#09090b",
    buttonBorder: "1px solid #e4e4e7",
    buttonRadius: "0.85rem",
    buttonShadow: "0 1px 2px rgba(0,0,0,0.06)",
    buttonHoverBg: "#f4f4f5",
  },
  {
    id: "noir",
    name: "Noir",
    background: "#0a0a0a",
    text: "#fafafa",
    muted: "#a1a1aa",
    ring: "#262626",
    buttonBg: "#161616",
    buttonText: "#fafafa",
    buttonBorder: "1px solid #262626",
    buttonRadius: "0.85rem",
    buttonShadow: "none",
    buttonHoverBg: "#232323",
  },
  {
    id: "midnight",
    name: "Midnight",
    background: "linear-gradient(160deg, #0f172a 0%, #312e81 100%)",
    text: "#f8fafc",
    muted: "#c7d2fe",
    ring: "rgba(255,255,255,0.35)",
    buttonBg: "rgba(255,255,255,0.08)",
    buttonText: "#f8fafc",
    buttonBorder: "1px solid rgba(255,255,255,0.18)",
    buttonRadius: "1rem",
    buttonShadow: "0 8px 24px rgba(0,0,0,0.25)",
    buttonHoverBg: "rgba(255,255,255,0.16)",
    backdrop: "blur(8px)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "linear-gradient(160deg, #ff5f6d 0%, #ffc371 100%)",
    text: "#3b0a14",
    muted: "rgba(59,10,20,0.72)",
    ring: "rgba(255,255,255,0.6)",
    buttonBg: "rgba(255,255,255,0.92)",
    buttonText: "#3b0a14",
    buttonBorder: "none",
    buttonRadius: "9999px",
    buttonShadow: "0 6px 20px rgba(0,0,0,0.15)",
    buttonHoverBg: "#ffffff",
  },
  {
    id: "ocean",
    name: "Ocean",
    background: "linear-gradient(160deg, #2193b0 0%, #6dd5ed 100%)",
    text: "#04293a",
    muted: "rgba(4,41,58,0.72)",
    ring: "rgba(255,255,255,0.6)",
    buttonBg: "rgba(255,255,255,0.9)",
    buttonText: "#04293a",
    buttonBorder: "none",
    buttonRadius: "0.85rem",
    buttonShadow: "0 6px 20px rgba(0,0,0,0.12)",
    buttonHoverBg: "#ffffff",
  },
  {
    id: "forest",
    name: "Forest",
    background: "linear-gradient(160deg, #0b3d2e 0%, #3a7d44 100%)",
    text: "#f0fdf4",
    muted: "#bbf7d0",
    ring: "rgba(255,255,255,0.35)",
    buttonBg: "rgba(255,255,255,0.1)",
    buttonText: "#f0fdf4",
    buttonBorder: "1px solid rgba(255,255,255,0.2)",
    buttonRadius: "0.85rem",
    buttonShadow: "none",
    buttonHoverBg: "rgba(255,255,255,0.18)",
    backdrop: "blur(6px)",
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    background: "linear-gradient(160deg, #ff9a9e 0%, #fecfef 100%)",
    text: "#6b2150",
    muted: "rgba(107,33,80,0.72)",
    ring: "rgba(255,255,255,0.7)",
    buttonBg: "#ffffff",
    buttonText: "#6b2150",
    buttonBorder: "none",
    buttonRadius: "9999px",
    buttonShadow: "0 6px 18px rgba(214,51,132,0.18)",
    buttonHoverBg: "#fff0f6",
  },
  {
    id: "gold",
    name: "Gold",
    background: "radial-gradient(circle at 50% 0%, #1c1917 0%, #0c0a09 70%)",
    text: "#fafaf9",
    muted: "#d6c08a",
    ring: "#b8902f",
    buttonBg: "transparent",
    buttonText: "#e8cf8b",
    buttonBorder: "1px solid #b8902f",
    buttonRadius: "0.5rem",
    buttonShadow: "none",
    buttonHoverBg: "#e8cf8b",
    buttonHoverText: "#0c0a09",
  },
];

export const DEFAULT_THEME_ID = "default";
export const THEME_IDS: string[] = THEMES.map((t) => t.id);

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isThemeId(id: string): boolean {
  return THEME_IDS.includes(id);
}
