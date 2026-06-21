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
  /** Optional decorative scene rendered behind public profile content. */
  scene?: ThemeScene;
};

export type ThemeSceneLayer = {
  width: string;
  height: string;
  background: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  filter?: string;
  opacity?: string;
  transform?: string;
  animation?: string;
};

export type ThemeScene = {
  before: ThemeSceneLayer;
  after?: ThemeSceneLayer;
  keyframes?: string;
};

const SCENE_LAYER_PROPERTIES: (keyof ThemeSceneLayer)[] = [
  "width",
  "height",
  "background",
  "top",
  "right",
  "bottom",
  "left",
  "border",
  "borderRadius",
  "boxShadow",
  "filter",
  "opacity",
  "transform",
  "animation",
];

function toCssPropertyName(property: keyof ThemeSceneLayer): string {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function renderSceneLayer(selector: string, layer: ThemeSceneLayer): string {
  const declarations = SCENE_LAYER_PROPERTIES
    .map((property) => {
      const value = layer[property];
      return value ? `      ${toCssPropertyName(property)}: ${value};` : null;
    })
    .filter((declaration): declaration is string => declaration !== null)
    .join("\n");

  return `
    ${selector} {
      content: "";
      position: fixed;
      pointer-events: none;
      z-index: 0;
${declarations}
    }`;
}

export function renderThemeSceneCss(theme: Theme): string {
  if (!theme.scene) return "";

  return `
    ${theme.scene.keyframes ?? ""}
    .ol-page > * {
      position: relative;
      z-index: 1;
    }
    ${renderSceneLayer(".ol-page::before", theme.scene.before)}
    ${theme.scene.after ? renderSceneLayer(".ol-page::after", theme.scene.after) : ""}
    @media (prefers-reduced-motion: reduce) {
      .ol-page::before,
      .ol-page::after {
        animation: none !important;
      }
    }
  `;
}

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
    description: "A 2001 portal-style scene with floating panels, glossy depth, and sunny motion.",
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
    scene: {
      keyframes: `
    @keyframes portal-panel-drift {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(-5deg); }
      50% { transform: translate3d(-14px, 10px, 0) rotate(-2deg); }
    }
    @keyframes portal-orbit {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(18px, -12px, 0) scale(1.04); }
    }`,
      before: {
        width: "22rem",
        height: "15rem",
        top: "8%",
        right: "-7rem",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.9) 0 16%, rgba(147,197,253,0.78) 16% 100%), linear-gradient(90deg, #ef4444 0 18%, #facc15 18% 36%, #22c55e 36% 54%, transparent 54%)",
        border: "1px solid rgba(37,99,235,0.35)",
        borderRadius: "1.1rem",
        boxShadow: "0 26px 70px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.95)",
        opacity: "0.78",
        transform: "rotate(-5deg)",
        animation: "portal-panel-drift 13s ease-in-out infinite",
      },
      after: {
        width: "18rem",
        height: "18rem",
        bottom: "-5rem",
        left: "-4rem",
        background:
          "radial-gradient(circle at 38% 34%, rgba(255,255,255,0.95) 0 10%, rgba(250,204,21,0.78) 11% 31%, rgba(59,130,246,0.28) 32% 58%, transparent 59%)",
        borderRadius: "9999px",
        filter: "blur(0.2px)",
        opacity: "0.85",
        animation: "portal-orbit 16s ease-in-out infinite",
      },
    },
  },
  {
    id: "aqua-2001",
    name: "Aqua 2001",
    collection: "Web 2001",
    description: "A 2001 glass scene with translucent bubbles, shine, and gentle drift.",
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
    scene: {
      keyframes: `
    @keyframes aqua-bubble-rise {
      0%, 100% { transform: translate3d(0, 10px, 0) scale(1); }
      50% { transform: translate3d(0, -18px, 0) scale(1.03); }
    }
    @keyframes aqua-lens-glide {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(8deg); }
      50% { transform: translate3d(-16px, 8px, 0) rotate(12deg); }
    }`,
      before: {
        width: "21rem",
        height: "21rem",
        top: "5%",
        left: "-7rem",
        background:
          "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.96) 0 9%, rgba(255,255,255,0.38) 10% 22%, rgba(56,189,248,0.3) 23% 54%, rgba(37,99,235,0.08) 55% 100%)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: "9999px",
        boxShadow: "inset -22px -28px 44px rgba(37,99,235,0.18), 0 28px 80px rgba(14,165,233,0.24)",
        opacity: "0.86",
        animation: "aqua-bubble-rise 14s ease-in-out infinite",
      },
      after: {
        width: "17rem",
        height: "10rem",
        right: "-3rem",
        bottom: "12%",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(125,211,252,0.18)), radial-gradient(circle at 24% 28%, rgba(255,255,255,0.95), transparent 22%)",
        border: "1px solid rgba(255,255,255,0.55)",
        borderRadius: "9999px 9999px 4rem 9999px",
        boxShadow: "0 22px 60px rgba(59,130,246,0.24), inset 0 1px 0 rgba(255,255,255,0.9)",
        opacity: "0.74",
        transform: "rotate(8deg)",
        animation: "aqua-lens-glide 17s ease-in-out infinite",
      },
    },
  },
  {
    id: "magazine-2001",
    name: "Magazine 2001",
    collection: "Web 2001",
    description: "A 2001 editorial scene with layered paper, print texture, and slow page drift.",
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
    scene: {
      keyframes: `
    @keyframes magazine-page-float {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(4deg); }
      50% { transform: translate3d(8px, -10px, 0) rotate(2deg); }
    }
    @keyframes magazine-dot-slide {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(-10px, 8px, 0); }
    }`,
      before: {
        width: "18rem",
        height: "24rem",
        top: "7%",
        right: "-5rem",
        background:
          "linear-gradient(90deg, rgba(127,29,29,0.16) 0 1px, transparent 1px 28%), linear-gradient(180deg, rgba(255,253,245,0.92) 0 18%, rgba(254,226,226,0.85) 18% 24%, rgba(255,253,245,0.9) 24% 100%)",
        border: "1px solid rgba(127,29,29,0.32)",
        borderRadius: "0.45rem",
        boxShadow: "16px 16px 0 rgba(127,29,29,0.12), 0 28px 70px rgba(36,27,21,0.18)",
        opacity: "0.7",
        transform: "rotate(4deg)",
        animation: "magazine-page-float 18s ease-in-out infinite",
      },
      after: {
        width: "13rem",
        height: "13rem",
        left: "-3rem",
        bottom: "8%",
        background:
          "radial-gradient(circle, rgba(185,28,28,0.35) 0 18%, transparent 19% 100%) 0 0 / 1.5rem 1.5rem",
        borderRadius: "9999px",
        filter: "blur(0.3px)",
        opacity: "0.58",
        animation: "magazine-dot-slide 15s ease-in-out infinite",
      },
    },
  },
  {
    id: "arcade-2001",
    name: "Arcade 2001",
    collection: "Web 2001",
    description: "A 2001 Flash-era scene with neon orbs, arcade glow, and animated graphics.",
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
    scene: {
      keyframes: `
    @keyframes arcade-neon-pulse {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
      50% { transform: translate3d(-12px, 10px, 0) scale(1.08); opacity: 0.94; }
    }
    @keyframes arcade-grid-scan {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(-10deg); }
      50% { transform: translate3d(16px, -8px, 0) rotate(-7deg); }
    }`,
      before: {
        width: "20rem",
        height: "20rem",
        top: "4%",
        right: "-6rem",
        background:
          "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.78) 0 12%, rgba(124,58,237,0.48) 13% 34%, rgba(34,211,238,0.22) 35% 58%, transparent 59%)",
        borderRadius: "9999px",
        boxShadow: "0 0 34px rgba(236,72,153,0.55), 0 0 90px rgba(34,211,238,0.28)",
        filter: "saturate(1.25)",
        opacity: "0.72",
        animation: "arcade-neon-pulse 9s ease-in-out infinite",
      },
      after: {
        width: "24rem",
        height: "16rem",
        left: "-8rem",
        bottom: "4%",
        background:
          "linear-gradient(rgba(250,204,21,0.34) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.28) 1px, transparent 1px)",
        border: "1px solid rgba(250,204,21,0.35)",
        borderRadius: "1.25rem",
        boxShadow: "0 0 44px rgba(124,58,237,0.38)",
        opacity: "0.5",
        transform: "rotate(-10deg)",
        animation: "arcade-grid-scan 12s ease-in-out infinite",
      },
    },
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
