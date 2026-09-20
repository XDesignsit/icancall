// Server-side source of truth for paid add-ons (extra phone numbers, voice
// minute blocks). The counts in profiles.settings.addons are only ever raised
// by a Creem checkout this server has verified (api/creem/confirm-addon) and
// only lowered here — never by what the browser sends.
//
// The phone-number add-on is its own recurring Creem subscription, separate
// from the plan's. Each purchase is recorded in settings.addonSubscriptions so
// removing a number, cancelling the plan, or the plan ending also stops that
// subscription from billing.

import { supabase } from "@/lib/supabase";
import { planConfig } from "@/lib/planConfig";
import { CREEM_API, creemEntityId, creemHeaders, subscriptionLiveness } from "@/lib/creem";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type AddonId = "phone_number" | "voice_minutes";

export const ADDON_PRODUCT_IDS: Record<AddonId, string | undefined> = {
  phone_number:  process.env.CREEM_PRODUCT_ID_ADDON_PHONE_NUMBER,
  voice_minutes: process.env.CREEM_PRODUCT_ID_ADDON_VOICE_MINUTES,
};

/** Most units of one add-on a single checkout may buy. */
export const MAX_ADDON_UNITS = 10;

export function isAddonId(v: unknown): v is AddonId {
  return v === "phone_number" || v === "voice_minutes";
}

export function addonForProductId(productId: string | undefined | null): AddonId | null {
  if (!productId) return null;
  for (const addon of Object.keys(ADDON_PRODUCT_IDS) as AddonId[]) {
    if (ADDON_PRODUCT_IDS[addon] === productId) return addon;
  }
  return null;
}

export interface AddonSubscription {
  id: string;
  units: number;
  checkoutId: string;
  status: "active" | "scheduled_cancel" | "canceled";
}

export function addonSubscriptions(settings: Settings): AddonSubscription[] {
  return Array.isArray(settings.addonSubscriptions) ? settings.addonSubscriptions : [];
}

export function paidExtraNumbers(settings: Settings): number {
  return Math.max(0, Number(settings.addons?.extraNumbers) || 0);
}

/** How many phone numbers the account may hold: the plan's, plus paid extras. */
export function lineAllowance(settings: Settings): number {
  return planConfig(settings.plan).includedLines + paidExtraNumbers(settings);
}

// ── Verifying an add-on purchase ──

export interface VerifiedAddonPurchase {
  addon: AddonId;
  units: number;
  customerId?: string;
  subscriptionId?: string;
}

export type AddonPurchaseCheck =
  | { ok: true; purchase: VerifiedAddonPurchase }
  | { ok: false; reason: "lookup_failed" | "not_paid" | "not_an_addon" | "not_yours" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Asks Creem whether an add-on checkout was really paid, what it bought, how
 * many units, and whether it was started by this account. Add-on checkouts are
 * only ever created for a signed-in owner, so metadata.user_id must match.
 */
export async function verifyAddonCheckout(checkoutId: string, userId: string): Promise<AddonPurchaseCheck> {
  let checkout: Record<string, any> | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  // The customer is sent back the moment payment succeeds; give Creem a few
  // seconds to mark the checkout completed before calling it unpaid.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1500);
    const res = await fetch(`${CREEM_API}/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`, {
      headers: creemHeaders(),
    });
    if (!res.ok) {
      console.error(`Creem add-on checkout lookup error (${res.status}):`, await res.text());
      return { ok: false, reason: "lookup_failed" };
    }
    checkout = await res.json();
    if (checkout?.status === "completed") break;
  }
  if (checkout?.status !== "completed") return { ok: false, reason: "not_paid" };

  const addon = addonForProductId(creemEntityId(checkout.product));
  if (!addon) return { ok: false, reason: "not_an_addon" };
  if (checkout.metadata?.user_id !== userId) return { ok: false, reason: "not_yours" };

  const units = Math.min(MAX_ADDON_UNITS, Math.max(1, Math.floor(Number(checkout.units) || 1)));
  return {
    ok: true,
    purchase: {
      addon,
      units,
      customerId: creemEntityId(checkout.customer),
      subscriptionId: creemEntityId(checkout.subscription),
    },
  };
}

type AddonCounts = { extraNumbers?: number; minuteBlocks?: number } & Record<string, unknown>;

export function creditedAddons(addons: AddonCounts | undefined, addon: AddonId, units: number): AddonCounts {
  const current = addons || {};
  return addon === "phone_number"
    ? { ...current, extraNumbers: (Number(current.extraNumbers) || 0) + units }
    : { ...current, minuteBlocks: (Number(current.minuteBlocks) || 0) + units };
}

/**
 * Credits a verified purchase, once per checkout — api/creem/confirm-addon and
 * the checkout.completed webhook both land here, in either order. Returns the
 * account's add-on counts afterwards, or null if they could not be saved.
 */
export async function creditAddonPurchase(
  userId: string,
  settings: Settings,
  checkoutId: string,
  purchase: VerifiedAddonPurchase,
): Promise<AddonCounts | null> {
  const applied: string[] = Array.isArray(settings.addonCheckouts) ? settings.addonCheckouts : [];
  if (applied.includes(checkoutId)) return settings.addons || {};

  const { addon, units, subscriptionId, customerId } = purchase;
  const next = creditedAddons(settings.addons, addon, units);
  const saved = await saveSettingsPatch(userId, settings, {
    addons: next,
    addonCheckouts: [...applied, checkoutId],
    creem_customer_id: settings.creem_customer_id ?? customerId,
    // The extra-number add-on bills monthly on a subscription of its own;
    // keep its id so it can be stopped when the number or the plan goes.
    ...(addon === "phone_number" && subscriptionId
      ? { addonSubscriptions: [...addonSubscriptions(settings), { id: subscriptionId, units, checkoutId, status: "active" }] }
      : {}),
  });
  return saved ? next : null;
}

// ── Stopping add-on subscriptions ──

async function creemSubscriptionCall(subscriptionId: string, path: string, body?: unknown): Promise<Record<string, any> | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const res = await fetch(`${CREEM_API}/subscriptions/${encodeURIComponent(subscriptionId)}${path}`, {
      method: "POST",
      headers: creemHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      console.error(`Creem add-on subscription ${path || "update"} error (${res.status}) for ${subscriptionId}:`, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Creem add-on subscription ${path || "update"} failed for ${subscriptionId}:`, err);
    return null;
  }
}

/** Cancels today. Already over at Creem (customer portal, lapsed payment) counts as done. */
async function cancelNow(subscriptionId: string): Promise<boolean> {
  if (await creemSubscriptionCall(subscriptionId, "/cancel", { mode: "immediate" })) return true;
  return (await subscriptionLiveness(subscriptionId)).state === "ended";
}

/** Lowers a subscription's unit count. No proration: nothing is refunded, the lower price starts at the next renewal. */
async function setSubscriptionUnits(subscriptionId: string, units: number): Promise<boolean> {
  const res = await fetch(`${CREEM_API}/subscriptions?subscription_id=${encodeURIComponent(subscriptionId)}`, {
    headers: creemHeaders(),
  }).catch(() => null);
  if (!res?.ok) return false;
  const sub = await res.json();
  const item = Array.isArray(sub?.items) ? sub.items[0] : null;
  if (!item?.id) return false;
  const updated = await creemSubscriptionCall(subscriptionId, "", {
    items: [{ id: item.id, units }],
    update_behavior: "proration-none",
  });
  return !!updated;
}

/**
 * Stops billing for `by` extra numbers the account no longer holds, newest
 * purchase first. Returns the settings patch to persist. The allowance drops
 * either way — the numbers are gone — and a subscription Creem would not
 * change stays recorded as active and is logged, so it can be stopped by hand.
 */
export async function reduceExtraNumbers(settings: Settings, by: number): Promise<Settings> {
  let remaining = Math.min(by, paidExtraNumbers(settings));
  if (remaining <= 0) return {};
  const released = remaining;

  const subs = addonSubscriptions(settings).map((s) => ({ ...s }));
  for (let i = subs.length - 1; i >= 0 && remaining > 0; i--) {
    const sub = subs[i];
    if (sub.status === "canceled") continue;
    if (sub.units <= remaining) {
      // The number is already back with the carrier, so stop this one today.
      if (!(await cancelNow(sub.id))) continue;
      remaining -= sub.units;
      sub.status = "canceled";
      sub.units = 0;
    } else if (await setSubscriptionUnits(sub.id, sub.units - remaining)) {
      sub.units -= remaining;
      remaining = 0;
    }
  }
  if (remaining > 0) {
    console.error(`Add-on billing not fully reduced: ${remaining} extra number(s) still billed at Creem after removal.`);
  }

  return {
    addons: { ...(settings.addons || {}), extraNumbers: paidExtraNumbers(settings) - released },
    addonSubscriptions: subs,
  };
}

/**
 * Follows the plan subscription: "scheduled" when the owner cancels at period
 * end, "immediate" once the plan has actually ended, "resume" when a pending
 * cancellation is taken back. Returns the settings patch to persist.
 */
export async function followPlanSubscription(settings: Settings, action: "scheduled" | "immediate" | "resume"): Promise<Settings> {
  const subs = addonSubscriptions(settings).map((s) => ({ ...s }));
  if (subs.length === 0) return {};

  for (const sub of subs) {
    if (sub.status === "canceled") continue;
    if (action === "resume") {
      if (sub.status !== "scheduled_cancel") continue;
      if (await creemSubscriptionCall(sub.id, "/resume")) sub.status = "active";
    } else if (action === "scheduled") {
      if (sub.status !== "active") continue;
      if (await creemSubscriptionCall(sub.id, "/cancel", { mode: "scheduled", onExecute: "cancel" })) sub.status = "scheduled_cancel";
    } else if (await cancelNow(sub.id)) {
      sub.status = "canceled";
      sub.units = 0;
    }
  }

  // Once the plan is over nothing is being paid for any more; the numbers
  // themselves stay held for the grace period (src/lib/subscriptionEnd.ts).
  return action === "immediate"
    ? { addonSubscriptions: subs, addons: { ...(settings.addons || {}), extraNumbers: 0 } }
    : { addonSubscriptions: subs };
}

export async function saveSettingsPatch(userId: string, settings: Settings, patch: Settings): Promise<boolean> {
  if (Object.keys(patch).length === 0) return true;
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...settings, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("addons: failed to persist settings:", error);
  return !error;
}
