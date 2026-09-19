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

export interface VerifiedPlanPurchase {
  plan: PlanId;
  billingCycle: BillingCycle;
  customerId?: string;
  subscriptionId?: string;
}

export type PurchaseCheck =
  | { ok: true; purchase: VerifiedPlanPurchase }
  | { ok: false; reason: "lookup_failed" | "not_paid" | "not_a_plan" | "not_yours" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Asks Creem whether a checkout was really paid, what it bought, and whether it
 * belongs to this person — the only proof of payment the server accepts. The
 * browser's "payment succeeded" signal is never trusted on its own.
 *
 * Ownership: the checkout carries metadata.user_id / metadata.signup_email set
 * when it was created, and Creem records the email the customer paid with.
 */
export async function verifyPlanCheckout(
  checkoutId: string,
  owner: { userId?: string | null; email: string },
): Promise<PurchaseCheck> {
  let checkout: Record<string, any> | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  // The customer is redirected back the moment payment succeeds; give Creem a
  // few seconds to mark the checkout completed before calling it unpaid.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1500);
    const res = await fetch(`${CREEM_API}/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`, {
      headers: creemHeaders(),
    });
    if (!res.ok) {
      console.error(`Creem checkout lookup error (${res.status}):`, await res.text());
      return { ok: false, reason: "lookup_failed" };
    }
    checkout = await res.json();
    if (checkout?.status === "completed") break;
  }
  if (checkout?.status !== "completed") return { ok: false, reason: "not_paid" };

  const bought = planForProductId(creemEntityId(checkout.product));
  if (!bought) return { ok: false, reason: "not_a_plan" };

  const email = owner.email.trim().toLowerCase();
  const same = (v: unknown) => typeof v === "string" && v.trim().toLowerCase() === email;
  const owns =
    (!!owner.userId && checkout.metadata?.user_id === owner.userId) ||
    same(checkout.metadata?.signup_email) ||
    same(checkout.customer?.email);
  if (!owns) return { ok: false, reason: "not_yours" };

  return {
    ok: true,
    purchase: {
      ...bought,
      customerId: creemEntityId(checkout.customer),
      subscriptionId: creemEntityId(checkout.subscription),
    },
  };
}

/** The plan an existing subscription is paying for, or null unless it is active. */
export async function activePlanForSubscription(subscriptionId: string): Promise<VerifiedPlanPurchase | null> {
  const res = await fetch(`${CREEM_API}/subscriptions?subscription_id=${encodeURIComponent(subscriptionId)}`, {
    headers: creemHeaders(),
  });
  if (!res.ok) {
    console.error(`Creem subscription lookup error (${res.status}):`, await res.text());
    return null;
  }
  const sub = await res.json();
  if (sub?.status !== "active" && sub?.status !== "trialing") return null;
  const plan = planForProductId(creemEntityId(sub.product));
  return plan ? { ...plan, subscriptionId, customerId: creemEntityId(sub.customer) } : null;
}
