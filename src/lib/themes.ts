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
  collection: string;
  description: string;
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
    collection: "Essentials",
    description: "A bright, minimal preset for a neutral public profile.",
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
    collection: "Essentials",
    description: "A restrained dark preset with quiet contrast.",
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
    collection: "Essentials",
    description: "Deep indigo glass styling with soft luminous buttons.",
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
    collection: "Essentials",
    description: "Warm gradients and rounded buttons for a playful page.",
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
    collection: "Essentials",
    description: "Cool blues with crisp white link cards.",
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
    collection: "Essentials",
    description: "Evergreen tones with subtle translucent buttons.",
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
    collection: "Essentials",
    description: "Soft pink gradients and pill-shaped links.",
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
    collection: "Essentials",
    description: "A dark luxury preset with metallic line work.",
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
  {
    id: "portal-2001",
    name: "Portal 2001",
    collection: "Web 2001",
    description: "A 2001 portal-style preset with glossy blue panels and sunny accents.",
    background:
      "linear-gradient(180deg, #d9ecff 0%, #ffffff 36%, #f6d365 100%)",
    text: "#082f66",
    muted: "#365f91",
    ring: "#0b63ce",
    buttonBg: "linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)",
    buttonText: "#082f66",
    buttonBorder: "1px solid #2563eb",
    buttonRadius: "0.45rem",
    buttonShadow: "0 3px 0 #93c5fd, 0 8px 18px rgba(37,99,235,0.22)",
    buttonHoverBg: "linear-gradient(180deg, #fff7cc 0%, #bfdbfe 100%)",
  },
  {
    id: "aqua-2001",
    name: "Aqua 2001",
    collection: "Web 2001",
    description: "A 2001 glassy Aqua preset inspired by translucent product pages.",
    background:
      "radial-gradient(circle at 50% 0%, #ffffff 0%, #dbeafe 42%, #8ec5ff 100%)",
    text: "#102033",
    muted: "#43627d",
    ring: "rgba(59,130,246,0.75)",
    buttonBg: "linear-gradient(180deg, #ffffff 0%, #bfdbfe 48%, #60a5fa 100%)",
    buttonText: "#0f2742",
    buttonBorder: "1px solid rgba(15,39,66,0.28)",
    buttonRadius: "9999px",
    buttonShadow:
      "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 18px rgba(37,99,235,0.24)",
    buttonHoverBg: "linear-gradient(180deg, #ffffff 0%, #dbeafe 48%, #38bdf8 100%)",
  },
  {
    id: "magazine-2001",
    name: "Magazine 2001",
    collection: "Web 2001",
    description: "A 2001 editorial preset with paper tones, ink borders, and red links.",
    background:
      "linear-gradient(90deg, rgba(31,41,55,0.06) 1px, transparent 1px), linear-gradient(180deg, #fff8e7 0%, #f1dfb8 100%)",
    text: "#241b15",
    muted: "#745f49",
    ring: "#b91c1c",
    buttonBg: "#fffdf5",
    buttonText: "#241b15",
    buttonBorder: "1px solid #7f1d1d",
    buttonRadius: "0.2rem",
    buttonShadow: "4px 4px 0 rgba(127,29,29,0.22)",
    buttonHoverBg: "#fee2e2",
  },
  {
    id: "arcade-2001",
    name: "Arcade 2001",
    collection: "Web 2001",
    description: "A 2001 Flash-era preset with neon color, deep contrast, and chunky cards.",
    background:
      "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.28) 0%, transparent 28%), radial-gradient(circle at 80% 0%, rgba(251,191,36,0.32) 0%, transparent 26%), linear-gradient(145deg, #1e0052 0%, #050018 100%)",
    text: "#f8fafc",
    muted: "#c4b5fd",
    ring: "#facc15",
    buttonBg: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
    buttonText: "#ffffff",
    buttonBorder: "1px solid rgba(250,204,21,0.75)",
    buttonRadius: "0.7rem",
    buttonShadow: "0 0 0 2px rgba(34,211,238,0.24), 0 10px 24px rgba(236,72,153,0.32)",
    buttonHoverBg: "linear-gradient(135deg, #06b6d4 0%, #f59e0b 100%)",
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
