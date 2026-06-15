import Stripe from "stripe";

/**
 * Stripe SDK singleton.
 * Returns null when STRIPE_SECRET_KEY is not configured so the rest of the
 * app can degrade gracefully instead of crashing at import time.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/** Price IDs configured in your Stripe dashboard. */
export const STRIPE_PRICES = {
  /** Monthly Pro subscription price ID */
  proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  /** Yearly Pro subscription price ID */
  proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
} as const;

export const STRIPE_CONFIGURED = Boolean(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PRO_PRICES_CONFIGURED = Boolean(
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
);
