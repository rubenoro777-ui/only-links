import type { Profile } from "@/lib/database.types";

export function isPro(profile: Pick<Profile, "subscription_status">): boolean {
  return profile.subscription_status === "pro";
}

export type BillingInterval = "month" | "year";

export const PRO_PRICE_MONTHLY_CENTS = 500;  // $5/mo
export const PRO_PRICE_YEARLY_CENTS  = 4800; // $48/yr

export type PlanFeature = {
  label: string;
  free: boolean | string;
  pro: boolean | string;
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Links",                      free: "Up to 10",   pro: "Unlimited"    },
  { label: "Link sections",              free: true,         pro: true           },
  { label: "Custom design & basic themes", free: true,       pro: true           },
  { label: "Premium scene themes",       free: false,        pro: true           },
  { label: "NFC & share bar",            free: true,         pro: true           },
  { label: "Analytics (30-day)",         free: true,         pro: true           },
  { label: "Country, device & browser breakdowns", free: true, pro: true         },
  { label: "Per-link analytics",         free: true,         pro: true           },
  { label: "CSV analytics export",       free: false,        pro: true           },
  { label: "Remove OnlyLinks branding",  free: false,        pro: true           },
  { label: "Custom domain",             free: false,        pro: true           },
  { label: "Monetised (locked) links",   free: "20% platform fee", pro: "8% platform fee" },
  { label: "Priority support",           free: false,        pro: true           },
];
