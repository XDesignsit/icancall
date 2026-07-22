// App-side source of truth for subscription plan entitlements and pricing.
// Used by the signup wizard, dashboard, and billing/telephony API routes.
//
// Deliberately separate from src/lib/pricing.ts: that file feeds public
// marketing surfaces (homepage, llms.txt, markdown edition), which only
// advertise Essential and Pro for now. Care Team is app-only until it
// graduates to the marketing pages.

export type PlanId = "essential" | "pro" | "careteam";

export interface PlanConfig {
  id: PlanId;
  name: string;
  monthlyAmount: number;
  annualAmount: number;
  monthlyLabel: string;
  annualLabel: string;
  /** Phone numbers included in the plan at no extra cost */
  includedLines: number;
  /** Trusted contacts allowed per line */
  contactsPerLine: number;
  /** Voice minutes included per billing cycle (pooled across all lines) */
  voiceMinutes: number;
  /** Caregiver logins (account owner counts as one seat) */
  seats: number;
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  essential: {
    id: "essential",
    name: "Essential",
    monthlyAmount: 14.99,
    annualAmount: 149,
    monthlyLabel: "$14.99",
    annualLabel: "$149",
    includedLines: 1,
    contactsPerLine: 3,
    voiceMinutes: 30,
    seats: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyAmount: 24.99,
    annualAmount: 249,
    monthlyLabel: "$24.99",
    annualLabel: "$249",
    includedLines: 2,
    contactsPerLine: 6,
    voiceMinutes: 60,
    seats: 1,
  },
  careteam: {
    id: "careteam",
    name: "Care Team",
    monthlyAmount: 49.99,
    annualAmount: 499,
    monthlyLabel: "$49.99",
    annualLabel: "$499",
    includedLines: 5,
    contactsPerLine: 15,
    voiceMinutes: 150,
    seats: 2,
  },
};

/** Resolve a stored plan id (possibly missing/unknown) to its config. */
export function planConfig(plan: string | undefined | null): PlanConfig {
  return PLAN_CONFIG[(plan as PlanId) || "pro"] || PLAN_CONFIG.pro;
}
