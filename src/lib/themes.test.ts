import { describe, expect, it } from "vitest";
import { getTheme, isThemeId, THEMES } from "./themes";

const retro2001PresetIds = [
  "portal-2001",
  "aqua-2001",
  "magazine-2001",
  "arcade-2001",
] as const;
const retro2001PresetIdSet = new Set<string>(retro2001PresetIds);

describe("theme presets", () => {
  it("offers curated 2001-inspired presets for users to choose", () => {
    const themeIds = THEMES.map((theme) => theme.id);

    expect(themeIds).toEqual(expect.arrayContaining([...retro2001PresetIds]));
  });

  it("describes each 2001-inspired preset in the picker", () => {
    const retro2001Themes = THEMES.filter((theme) =>
      retro2001PresetIdSet.has(theme.id),
    );

    expect(retro2001Themes).toHaveLength(retro2001PresetIds.length);
    expect(
      retro2001Themes.every((theme) => theme.collection === "Web 2001"),
    ).toBe(true);
    expect(
      retro2001Themes.every((theme) => theme.description.includes("2001")),
    ).toBe(true);
  });

  it("accepts the 2001-inspired presets as stored profile theme ids", () => {
    expect(retro2001PresetIds.every((themeId) => isThemeId(themeId))).toBe(true);
    expect(getTheme("aqua-2001").name).toBe("Aqua 2001");
  });

  it("keeps every preset complete enough for public rendering", () => {
    expect(THEMES).toEqual(
      expect.arrayContaining(
        THEMES.map((theme) =>
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            background: expect.any(String),
            text: expect.any(String),
            muted: expect.any(String),
            ring: expect.any(String),
            buttonBg: expect.any(String),
            buttonText: expect.any(String),
            buttonBorder: expect.any(String),
            buttonRadius: expect.any(String),
            buttonShadow: expect.any(String),
            buttonHoverBg: expect.any(String),
          }),
        ),
      ),
    );
  });
});
