// Server-side Stripe helpers shared by the checkout, portal, change-plan and
// webhook routes: the client, the plan → price id mapping (sourced only from
// env vars) and its reverse lookup, and the server-side checks that decide
// whether something was really paid for.

import Stripe from "stripe";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { isDemoEmail } from "@/lib/demoAccounts";
import type { PlanId } from "@/lib/planConfig";

export type BillingCycle = "monthly" | "yearly";

let client: Stripe | null = null;

/** The shared Stripe client. Only call it where STRIPE_SECRET_KEY is set (see isSimulatedBilling). */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export const PLAN_PRICE_IDS: Record<PlanId, Record<BillingCycle, string | undefined>> = {
  essential: {
    monthly: process.env.STRIPE_PRICE_ID_ESSENTIAL_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_ID_ESSENTIAL_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_ID_PRO_YEARLY,
  },
  careteam: {
    monthly: process.env.STRIPE_PRICE_ID_CARETEAM_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_ID_CARETEAM_YEARLY,
  },
};

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && v in PLAN_PRICE_IDS;
}

export function isBillingCycle(v: unknown): v is BillingCycle {
  return v === "monthly" || v === "yearly";
}

/** Reverse lookup: which plan/cycle a Stripe price id sells. Null for add-ons and unknown ids. */
export function planForPriceId(priceId: string | undefined | null): { plan: PlanId; billingCycle: BillingCycle } | null {
  if (!priceId) return null;
  for (const plan of Object.keys(PLAN_PRICE_IDS) as PlanId[]) {
    for (const billingCycle of ["monthly", "yearly"] as const) {
      if (PLAN_PRICE_IDS[plan][billingCycle] === priceId) return { plan, billingCycle };
    }
  }
  return null;
}

/** Stripe returns related objects either expanded (`{ id, ... }`) or as a bare id string. */
export function entityId(entity: unknown): string | undefined {
  if (typeof entity === "string") return entity || undefined;
  if (entity && typeof entity === "object") {
    const id = (entity as { id?: unknown }).id;
    if (typeof id === "string" && id) return id;
  }
  return undefined;
}

/**
 * Demo accounts must never reach the real payment gateway, and local/preview
 * environments without Stripe credentials get simulated billing.
 */
export function isSimulatedBilling(email: string | undefined | null): boolean {
  return !process.env.STRIPE_SECRET_KEY || (!!email && isDemoEmail(email));
}

/**
 * New signups are paused where they could not be paid for: production without
 * Stripe configured would otherwise fall through to the free simulated
 * checkout. SIGNUPS_PAUSED=true is a manual kill switch.
 */
export function signupsPaused(): boolean {
  if (process.env.SIGNUPS_PAUSED === "true") return true;
  return process.env.VERCEL_ENV === "production" && !process.env.STRIPE_SECRET_KEY;
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

// ── Reading a subscription ──

/** The states the app tracks in settings.subscriptionStatus. "scheduled_cancel" = cancelled but running until the period ends. */
export function appSubscriptionStatus(sub: Stripe.Subscription): string {
  if (sub.status === "canceled") return "canceled";
  if (sub.status === "incomplete_expired") return "expired";
  if ((sub.status === "active" || sub.status === "trialing") && (sub.cancel_at_period_end || sub.cancel_at)) return "scheduled_cancel";
  return sub.status;
}

const isoFromUnix = (seconds: number | null | undefined): string | undefined =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : undefined;

/** The paid period the subscription is currently in. Stripe keeps it on the subscription item. */
export function subscriptionPeriod(sub: Stripe.Subscription): { start?: string; end?: string } {
  const item = sub.items.data[0];
  return { start: isoFromUnix(item?.current_period_start), end: isoFromUnix(item?.current_period_end) };
}

/** The first item's price id and quantity: every subscription here sells exactly one price. */
export function subscriptionItem(sub: Stripe.Subscription): { itemId?: string; priceId?: string; units: number } {
  const item = sub.items.data[0];
  return { itemId: item?.id, priceId: item?.price?.id, units: item?.quantity ?? 1 };
}

export interface VerifiedPlanPurchase {
  plan: PlanId;
  billingCycle: BillingCycle;
  customerId?: string;
  subscriptionId?: string;
  /** Start of the paid period the purchase is in, ISO. Seeds settings.stripe_period_start. */
  periodStart?: string;
}

export type PurchaseCheck =
  | { ok: true; purchase: VerifiedPlanPurchase }
  | { ok: false; reason: "lookup_failed" | "not_paid" | "not_a_plan" | "not_yours" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RetrievedCheckout {
  session: Stripe.Checkout.Session;
  /** Set for subscription-mode sessions. */
  subscription: Stripe.Subscription | null;
  paid: boolean;
  /** What was bought: the subscription's item, or the session's line item for a one-time purchase. */
  item: { priceId?: string; units: number };
}

/**
 * Fetches a Checkout Session with its subscription and line items expanded,
 * giving a paid session a moment to settle before calling it unpaid. Null when
 * Stripe cannot be reached or does not know the session.
 */
export async function retrieveCheckoutSession(sessionId: string): Promise<RetrievedCheckout | null> {
  const fetchSession = () => stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription", "line_items"] });
  try {
    let session = await fetchSession();
    for (let attempt = 0; attempt < 3 && session.status !== "complete"; attempt++) {
      await sleep(1500);
      session = await fetchSession();
    }
    const subscription = typeof session.subscription === "object" ? session.subscription : null;
    const paid = session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required");
    const line = session.line_items?.data[0];
    const item = subscription ? subscriptionItem(subscription) : { priceId: line?.price?.id, units: line?.quantity ?? 1 };
    return { session, subscription, paid, item };
  } catch (err) {
    console.error("Stripe checkout lookup failed:", err);
    return null;
  }
}

/**
 * Asks Stripe whether a checkout was really paid, what it bought, and whether it
 * belongs to this person — the only proof of payment the server accepts. The
 * browser's "payment succeeded" signal is never trusted on its own.
 *
 * Ownership: the session carries metadata.user_id / metadata.signup_email set
 * when it was created, and Stripe records the email the customer paid with.
 */
export async function verifyPlanCheckout(
  sessionId: string,
  owner: { userId?: string | null; email: string },
): Promise<PurchaseCheck> {
  const found = await retrieveCheckoutSession(sessionId);
  if (!found) return { ok: false, reason: "lookup_failed" };
  const { session, subscription, paid } = found;
  if (!paid || !subscription) return { ok: false, reason: "not_paid" };

  const bought = planForPriceId(subscriptionItem(subscription).priceId);
  if (!bought) return { ok: false, reason: "not_a_plan" };

  const email = owner.email.trim().toLowerCase();
  const same = (v: unknown) => typeof v === "string" && v.trim().toLowerCase() === email;
  const owns =
    (!!owner.userId && session.metadata?.user_id === owner.userId) ||
    same(session.metadata?.signup_email) ||
    same(session.customer_details?.email);
  if (!owns) return { ok: false, reason: "not_yours" };

  return {
    ok: true,
    purchase: {
      ...bought,
      customerId: entityId(session.customer),
      subscriptionId: subscription.id,
      periodStart: subscriptionPeriod(subscription).start,
    },
  };
}

/** The plan an existing subscription is paying for, or null unless it is active. */
export async function activePlanForSubscription(subscriptionId: string): Promise<VerifiedPlanPurchase | null> {
  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    if (sub.status !== "active" && sub.status !== "trialing") return null;
    const plan = planForPriceId(subscriptionItem(sub).priceId);
    return plan ? { ...plan, subscriptionId, customerId: entityId(sub.customer), periodStart: subscriptionPeriod(sub).start } : null;
  } catch (err) {
    console.error("Stripe subscription lookup failed:", err);
    return null;
  }
}

/**
 * Whether Stripe still considers a subscription to be running. "unknown" means
 * the lookup itself failed — callers about to do something irreversible (the
 * number release job) must treat that as a reason to stop, not as "ended".
 */
export async function subscriptionLiveness(
  subscriptionId: string,
): Promise<{ state: "live"; purchase: VerifiedPlanPurchase | null } | { state: "ended" } | { state: "unknown" }> {
  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    if (sub.status === "canceled" || sub.status === "incomplete_expired") return { state: "ended" };
    // active, trialing, past_due, unpaid, paused, incomplete: not over.
    const plan = planForPriceId(subscriptionItem(sub).priceId);
    return { state: "live", purchase: plan ? { ...plan, subscriptionId, customerId: entityId(sub.customer) } : null };
  } catch (err) {
    console.error("Stripe subscription lookup failed:", err);
    return { state: "unknown" };
  }
}
