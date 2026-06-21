import type { Profile } from "@/lib/database.types";

export const DEFAULT_PLATFORM_FEE_BPS_FREE = 2_000;
export const DEFAULT_PLATFORM_FEE_BPS_PRO = 800;

export type ConnectProfile = Pick<
  Profile,
  "stripe_connect_account_id" | "stripe_connect_charges_enabled"
>;

export type SubscriptionTier = "free" | "pro";

function readPlatformFeeBps(envValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(envValue ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10_000) return fallback;
  return parsed;
}

export function getPlatformFeeBps(subscriptionStatus: SubscriptionTier): number {
  if (subscriptionStatus === "pro") {
    return readPlatformFeeBps(
      process.env.STRIPE_PLATFORM_FEE_BPS_PRO,
      DEFAULT_PLATFORM_FEE_BPS_PRO,
    );
  }

  return readPlatformFeeBps(
    process.env.STRIPE_PLATFORM_FEE_BPS_FREE,
    DEFAULT_PLATFORM_FEE_BPS_FREE,
  );
}

export function calculatePlatformFeeCents(
  priceCents: number,
  subscriptionStatus: SubscriptionTier,
): number {
  if (priceCents <= 0) return 0;

  const bps = getPlatformFeeBps(subscriptionStatus);
  const rawFee = Math.floor((priceCents * bps) / 10_000);
  const maxFee = priceCents - 1;

  return Math.min(Math.max(rawFee, 1), maxFee);
}

export function calculateCreatorNetCents(
  priceCents: number,
  subscriptionStatus: SubscriptionTier,
): number {
  return priceCents - calculatePlatformFeeCents(priceCents, subscriptionStatus);
}

export function formatPlatformFeePercent(bps: number): string {
  const percent = bps / 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

export function isConnectReady(profile: ConnectProfile): boolean {
  return Boolean(
    profile.stripe_connect_account_id && profile.stripe_connect_charges_enabled,
  );
}

export function subscriptionTierFromStatus(
  subscriptionStatus: string,
): SubscriptionTier {
  return subscriptionStatus === "pro" ? "pro" : "free";
}

export type ConnectStatus = {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  ready: boolean;
};

export function connectStatusFromProfile(
  profile: Pick<
    Profile,
    | "stripe_connect_account_id"
    | "stripe_connect_charges_enabled"
    | "stripe_connect_payouts_enabled"
    | "stripe_connect_details_submitted"
  >,
): ConnectStatus {
  return {
    accountId: profile.stripe_connect_account_id,
    chargesEnabled: profile.stripe_connect_charges_enabled,
    payoutsEnabled: profile.stripe_connect_payouts_enabled,
    detailsSubmitted: profile.stripe_connect_details_submitted,
    ready: isConnectReady(profile),
  };
}
