import { describe, expect, it } from "vitest";
import {
  accessCookieName,
  buildHandoffPath,
  COOKIE_MAX_AGE_SECONDS,
  createGrantFields,
  HANDOFF_TTL_MS,
  isCookieGrantValid,
  isHandoffGrantValid,
  type AccessGrant,
} from "./access-grants";

const baseGrant = (): AccessGrant => ({
  access_token: "abc123",
  expires_at: new Date(Date.now() + HANDOFF_TTL_MS).toISOString(),
  redeemed_at: null,
  revoked_at: null,
});

describe("access grants", () => {
  it("creates a unique token and short-lived handoff expiry like a password-manager share link", () => {
    const first = createGrantFields();
    const second = createGrantFields();

    expect(first.access_token).not.toBe(second.access_token);
    expect(first.access_token.length).toBeGreaterThanOrEqual(32);
    expect(new Date(first.expires_at).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(first.expires_at).getTime()).toBeLessThanOrEqual(
      Date.now() + HANDOFF_TTL_MS + 1000,
    );
  });

  it("allows a handoff token only before expiry and before first redemption", () => {
    const now = new Date("2026-06-21T12:00:00.000Z");
    const valid: AccessGrant = {
      access_token: "abc123",
      expires_at: "2026-06-21T12:30:00.000Z",
      redeemed_at: null,
      revoked_at: null,
    };
    const expired = {
      ...valid,
      expires_at: "2026-06-21T11:00:00.000Z",
    };
    const redeemed = {
      ...valid,
      redeemed_at: "2026-06-21T11:30:00.000Z",
    };

    expect(isHandoffGrantValid(valid, now)).toBe(true);
    expect(isHandoffGrantValid(expired, now)).toBe(false);
    expect(isHandoffGrantValid(redeemed, now)).toBe(false);
  });

  it("allows cookie access only after a handoff token has been redeemed once", () => {
    const active = {
      ...baseGrant(),
      redeemed_at: new Date().toISOString(),
    };
    const pending = baseGrant();
    const revoked = {
      ...active,
      revoked_at: new Date().toISOString(),
    };

    expect(isCookieGrantValid(active)).toBe(true);
    expect(isCookieGrantValid(pending)).toBe(false);
    expect(isCookieGrantValid(revoked)).toBe(false);
  });

  it("builds a private handoff path without exposing the destination URL", () => {
    const linkId = "11111111-1111-1111-1111-111111111111";
    const token = "secret-token";

    expect(buildHandoffPath(linkId, token)).toBe(
      `/l/${linkId}?t=${encodeURIComponent(token)}`,
    );
    expect(accessCookieName(linkId)).toBe(`ol_access_${linkId}`);
    expect(COOKIE_MAX_AGE_SECONDS).toBeGreaterThan(HANDOFF_TTL_MS / 1000);
  });
});
