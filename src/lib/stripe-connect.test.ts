import { describe, expect, it } from "vitest";
import {
  calculateCreatorNetCents,
  calculatePlatformFeeCents,
  DEFAULT_PLATFORM_FEE_BPS_FREE,
  DEFAULT_PLATFORM_FEE_BPS_PRO,
  formatPlatformFeePercent,
  getPlatformFeeBps,
  isConnectReady,
} from "./stripe-connect";

describe("stripe connect platform fees", () => {
  it("charges free creators a higher platform fee than pro creators", () => {
    expect(getPlatformFeeBps("free")).toBeGreaterThan(getPlatformFeeBps("pro"));
    expect(getPlatformFeeBps("free")).toBe(DEFAULT_PLATFORM_FEE_BPS_FREE);
    expect(getPlatformFeeBps("pro")).toBe(DEFAULT_PLATFORM_FEE_BPS_PRO);
  });

  it("calculates platform fee and creator net from the unlock price", () => {
    const priceCents = 499;

    const freeFee = calculatePlatformFeeCents(priceCents, "free");
    const proFee = calculatePlatformFeeCents(priceCents, "pro");

    expect(freeFee).toBe(Math.floor((priceCents * DEFAULT_PLATFORM_FEE_BPS_FREE) / 10_000));
    expect(proFee).toBe(Math.floor((priceCents * DEFAULT_PLATFORM_FEE_BPS_PRO) / 10_000));
    expect(calculateCreatorNetCents(priceCents, "free")).toBe(priceCents - freeFee);
    expect(calculateCreatorNetCents(priceCents, "pro")).toBe(priceCents - proFee);
    expect(freeFee).toBeGreaterThan(proFee);
  });

  it("never lets the platform fee consume the entire unlock price", () => {
    const priceCents = 50;
    const fee = calculatePlatformFeeCents(priceCents, "free");

    expect(fee).toBeGreaterThan(0);
    expect(fee).toBeLessThan(priceCents);
    expect(calculateCreatorNetCents(priceCents, "free")).toBeGreaterThan(0);
  });

  it("formats fee percentages for dashboard copy", () => {
    expect(formatPlatformFeePercent(DEFAULT_PLATFORM_FEE_BPS_FREE)).toBe("20%");
    expect(formatPlatformFeePercent(DEFAULT_PLATFORM_FEE_BPS_PRO)).toBe("8%");
  });
});

describe("stripe connect readiness", () => {
  it("allows link unlock checkout only when charges are enabled on the connected account", () => {
    expect(
      isConnectReady({
        stripe_connect_account_id: "acct_123",
        stripe_connect_charges_enabled: true,
      }),
    ).toBe(true);

    expect(
      isConnectReady({
        stripe_connect_account_id: "acct_123",
        stripe_connect_charges_enabled: false,
      }),
    ).toBe(false);

    expect(
      isConnectReady({
        stripe_connect_account_id: null,
        stripe_connect_charges_enabled: false,
      }),
    ).toBe(false);
  });
});
