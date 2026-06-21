import { afterEach, describe, expect, it } from "vitest";
import {
  hasProAccess,
  isAppOwner,
  isOwnerAccount,
  readPreviewPlan,
} from "./admin";

const freeProfile = {
  handle: "creator",
  subscription_status: "free" as const,
};

describe("admin plan access", () => {
  afterEach(() => {
    delete process.env.ONLYLINKS_OWNER_EMAILS;
    delete process.env.ONLYLINKS_OWNER_HANDLES;
  });

  it("grants pro access to configured owner email by default", () => {
    process.env.ONLYLINKS_OWNER_EMAILS = "owner@example.com";

    expect(
      hasProAccess({
        profile: freeProfile,
        email: "owner@example.com",
        previewPlan: "owner",
      }),
    ).toBe(true);
  });

  it("grants pro access to configured owner handle by default", () => {
    process.env.ONLYLINKS_OWNER_HANDLES = "rubenorozco";

    expect(
      hasProAccess({
        profile: { handle: "rubenorozco", subscription_status: "free" },
        email: "someone@else.com",
        previewPlan: "owner",
      }),
    ).toBe(true);
  });

  it("simulates free tier when owner selects free preview", () => {
    process.env.ONLYLINKS_OWNER_EMAILS = "owner@example.com";

    expect(
      hasProAccess({
        profile: freeProfile,
        email: "owner@example.com",
        previewPlan: "free",
      }),
    ).toBe(false);
  });

  it("does not grant access to non-owners", () => {
    process.env.ONLYLINKS_OWNER_EMAILS = "owner@example.com";

    expect(
      hasProAccess({
        profile: freeProfile,
        email: "fan@example.com",
        previewPlan: "owner",
      }),
    ).toBe(false);
  });

  it("recognises owner accounts by email or handle", () => {
    process.env.ONLYLINKS_OWNER_EMAILS = "owner@example.com";
    process.env.ONLYLINKS_OWNER_HANDLES = "myhandle";

    expect(isAppOwner("Owner@Example.com")).toBe(true);
    expect(isOwnerAccount({ handle: "MyHandle" })).toBe(true);
    expect(isOwnerAccount({ email: "other@example.com", handle: "other" })).toBe(
      false,
    );
  });

  it("defaults preview plan to owner access", () => {
    expect(readPreviewPlan(undefined)).toBe("owner");
    expect(readPreviewPlan("free")).toBe("free");
  });
});
