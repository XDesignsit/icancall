// Server-side Creem helpers shared by the checkout, portal, change-plan and
// webhook routes: API base selection, the plan → product id mapping (sourced
// only from env vars) and its reverse lookup.

import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { isDemoEmail } from "@/lib/demoAccounts";
import type { PlanId } from "@/lib/planConfig";

export type BillingCycle = "monthly" | "yearly";

export const CREEM_API = process.env.CREEM_API_KEY?.startsWith("creem_test_")
  ? "https://test-api.creem.io/v1"
  : "https://api.creem.io/v1";

export const PLAN_PRODUCT_IDS: Record<PlanId, Record<BillingCycle, string | undefined>> = {
  essential: {
    monthly: process.env.CREEM_PRODUCT_ID_ESSENTIAL_MONTHLY,
    yearly:  process.env.CREEM_PRODUCT_ID_ESSENTIAL_YEARLY,
  },
  pro: {
    monthly: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY,
    yearly:  process.env.CREEM_PRODUCT_ID_PRO_YEARLY,
  },
  careteam: {
    monthly: process.env.CREEM_PRODUCT_ID_CARETEAM_MONTHLY,
    yearly:  process.env.CREEM_PRODUCT_ID_CARETEAM_YEARLY,
  },
};

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && v in PLAN_PRODUCT_IDS;
}

export function isBillingCycle(v: unknown): v is BillingCycle {
  return v === "monthly" || v === "yearly";
}

/** Reverse lookup: which plan/cycle a Creem product id sells. Null for add-ons and unknown ids. */
export function planForProductId(productId: string | undefined | null): { plan: PlanId; billingCycle: BillingCycle } | null {
  if (!productId) return null;
  for (const plan of Object.keys(PLAN_PRODUCT_IDS) as PlanId[]) {
    for (const billingCycle of ["monthly", "yearly"] as const) {
      if (PLAN_PRODUCT_IDS[plan][billingCycle] === productId) return { plan, billingCycle };
    }
  }
  return null;
}

/** Creem returns related entities either expanded (`{ id, ... }`) or as a bare id string. */
export function creemEntityId(entity: unknown): string | undefined {
  if (typeof entity === "string") return entity || undefined;
  if (entity && typeof entity === "object") {
    const id = (entity as { id?: unknown }).id;
    if (typeof id === "string" && id) return id;
  }
  return undefined;
}

export function creemHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-key": process.env.CREEM_API_KEY!,
  };
}

/**
 * Demo accounts must never reach the real payment gateway, and local/preview
 * environments have no Creem credentials at all — both get simulated billing.
 */
export function isSimulatedBilling(email: string | undefined | null): boolean {
  return !process.env.CREEM_API_KEY || (!!email && isDemoEmail(email));
}

/** Email + user id of the signed-in user, or null when there is no valid session cookie. */
export async function sessionIdentity(): Promise<{ email: string; userId?: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;
    const payload = await verifySession(sessionToken);
    return payload ? { email: payload.email, userId: payload.userId } : null;
  } catch {
    return null;
  }
}
