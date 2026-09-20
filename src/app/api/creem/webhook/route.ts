import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { planConfig } from "@/lib/planConfig";
import { creemEntityId, planForProductId } from "@/lib/creem";
import { REACTIVATED_PATCH, endedPatch, isEndedStatus, sendSubscriptionEndedEmail } from "@/lib/subscriptionEnd";
import { MAX_ADDON_UNITS, addonForProductId, addonSubscriptions, creditAddonPurchase, followPlanSubscription, paidExtraNumbers } from "@/lib/addons";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface CreemObject {
  id?: string;
  units?: number;
  product?: unknown;
  customer?: { id?: string; email?: string } | string;
  subscription?: { id?: string; metadata?: Record<string, unknown> } | string;
  metadata?: Record<string, unknown>;
  current_period_start_date?: string;
  current_period_end_date?: string;
  status?: string;
}

// Checkouts started by a signed-in user carry metadata.user_id (copied onto the
// subscription by Creem); anything else is matched on the customer's email.
async function findProfile(obj: CreemObject): Promise<{ id: string; email?: string; settings: Settings } | null> {
  const subMeta = typeof obj.subscription === "object" ? obj.subscription?.metadata : undefined;
  const userId = obj.metadata?.user_id ?? subMeta?.user_id;
  if (typeof userId === "string" && userId) {
    const { data } = await supabase.from("profiles").select("id, email, settings").eq("id", userId).maybeSingle();
    if (data) return { id: data.id, email: data.email || undefined, settings: data.settings || {} };
  }
  const email = typeof obj.customer === "object" ? obj.customer?.email : undefined;
  if (email) {
    const { data } = await supabase.from("profiles").select("id, email, settings").eq("email", email).maybeSingle();
    if (data) return { id: data.id, email: data.email || undefined, settings: data.settings || {} };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const sig = Buffer.from(req.headers.get("creem-signature") ?? req.headers.get("x-creem-signature") ?? "");
    const expected = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"));
    if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Creem's envelope is { eventType, object }. The { type, data } spelling this
  // handler was first written against is still accepted.
  let eventType: string;
  let obj: CreemObject;
  try {
    const event = JSON.parse(rawBody);
    eventType = event.eventType ?? event.type ?? "";
    obj = event.object ?? event.data ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (eventType === "checkout.completed") {
    const customerId = creemEntityId(obj.customer);
    const subscriptionId = creemEntityId(obj.subscription);
    const boughtPlan = planForProductId(creemEntityId(obj.product));

    console.log(`Creem checkout.completed — customer: ${customerId}, subscription: ${subscriptionId}, plan: ${boughtPlan ? `${boughtPlan.plan}/${boughtPlan.billingCycle}` : "n/a"}`);

    const profile = customerId ? await findProfile(obj) : null;
    const boughtAddon = addonForProductId(creemEntityId(obj.product));
    if (profile && boughtAddon && obj.id && obj.metadata?.user_id === profile.id) {
      // Same crediting as api/creem/confirm-addon, for the customer who paid
      // and closed the window before the dashboard could confirm. Once per
      // checkout, whichever of the two gets here first.
      const units = Math.min(MAX_ADDON_UNITS, Math.max(1, Math.floor(Number(obj.units) || 1)));
      await creditAddonPurchase(profile.id, profile.settings, obj.id, { addon: boughtAddon, units, customerId, subscriptionId });
    } else if (profile) {
      await supabase
        .from("profiles")
        .update({
          settings: {
            ...profile.settings,
            creem_customer_id: customerId,
            // Only a plan purchase defines the account's subscription and plan.
            // Add-on checkouts must not replace the id that plan changes target.
            ...(boughtPlan ? { ...boughtPlan, creem_subscription_id: subscriptionId ?? profile.settings.creem_subscription_id } : {}),
          },
        })
        .eq("id", profile.id);
    }
  }

  // Keeps plan/billingCycle in step with the subscription's product, whoever
  // changed it: the dashboard (api/creem/change-plan), the Creem customer
  // portal, or the Creem merchant dashboard.
  if (eventType === "subscription.update" || eventType === "subscription.active" || eventType === "subscription.paid") {
    const subPlan = planForProductId(creemEntityId(obj.product));
    const profile = subPlan ? await findProfile(obj) : null;
    const knownSub = profile?.settings.creem_subscription_id;

    if (profile && subPlan && (!knownSub || knownSub === obj.id)) {
      const s = profile.settings;
      if (s.plan !== subPlan.plan || s.billingCycle !== subPlan.billingCycle || !knownSub) {
        console.log(`Creem ${eventType} — syncing ${profile.id} to ${subPlan.plan}/${subPlan.billingCycle}`);
        await supabase
          .from("profiles")
          .update({
            settings: {
              ...s,
              ...subPlan,
              creem_subscription_id: obj.id ?? knownSub,
              creem_customer_id: creemEntityId(obj.customer) ?? s.creem_customer_id,
            },
          })
          .eq("id", profile.id);
      }
    }
  }

  // Cancellation state, whoever caused it: the dashboard's cancel button
  // (api/creem/cancel-subscription), the Creem customer portal, a failed
  // renewal, or the merchant dashboard. scheduled_cancel = still active until
  // the period ends; canceled / expired = over.
  if (
    eventType === "subscription.scheduled_cancel" || eventType === "subscription.canceled" ||
    eventType === "subscription.expired" || eventType === "subscription.active" || eventType === "subscription.update"
  ) {
    const profile = await findProfile(obj);
    const knownSub = profile?.settings.creem_subscription_id;
    // Add-on subscriptions have their own lifecycle; only the plan's counts here.
    const isPlanSub = !!knownSub && knownSub === obj.id;
    const status =
      eventType === "subscription.scheduled_cancel" ? "scheduled_cancel"
      : eventType === "subscription.canceled" ? "canceled"
      : eventType === "subscription.expired" ? "expired"
      : obj.status;

    // An extra-number add-on that ended on its own (customer portal, failed
    // renewal): it is no longer paid for, so it no longer raises the allowance.
    const addonSub = profile && !isPlanSub ? addonSubscriptions(profile.settings).find((a) => a.id === obj.id) : undefined;
    if (profile && addonSub && addonSub.status !== "canceled" && isEndedStatus(status)) {
      console.log(`Creem ${eventType} — ${profile.id} add-on subscription ${obj.id} ended (${addonSub.units} number(s))`);
      await supabase
        .from("profiles")
        .update({
          settings: {
            ...profile.settings,
            addons: { ...(profile.settings.addons || {}), extraNumbers: Math.max(0, paidExtraNumbers(profile.settings) - addonSub.units) },
            addonSubscriptions: addonSubscriptions(profile.settings).map((a) => (a.id === obj.id ? { ...a, status: "canceled", units: 0 } : a)),
          },
        })
        .eq("id", profile.id);
    }

    if (profile && isPlanSub && status && profile.settings.subscriptionStatus !== status) {
      console.log(`Creem ${eventType} — ${profile.id} subscription is now ${status}`);
      const wasEnded = isEndedStatus(profile.settings.subscriptionStatus);
      // Ended: calls keep routing and the numbers are held for the grace
      // period (src/lib/subscriptionEnd.ts), then released by the daily job.
      // Running again: the clock stops and nothing is released.
      const patch = isEndedStatus(status)
        ? endedPatch(profile.settings, status)
        : status === "active" || status === "trialing"
          ? REACTIVATED_PATCH
          : { subscriptionStatus: status, subscriptionEndsAt: obj.current_period_end_date ?? profile.settings.subscriptionEndsAt ?? null };
      // Add-on subscriptions follow the plan, however it was cancelled or
      // brought back (the dashboard does the same in api/creem/cancel-subscription).
      const addonPatch = isEndedStatus(status)
        ? await followPlanSubscription(profile.settings, "immediate")
        : status === "scheduled_cancel"
          ? await followPlanSubscription(profile.settings, "scheduled")
          : status === "active" && profile.settings.subscriptionStatus === "scheduled_cancel"
            ? await followPlanSubscription(profile.settings, "resume")
            : {};
      await supabase
        .from("profiles")
        .update({ settings: { ...profile.settings, ...patch, ...addonPatch } })
        .eq("id", profile.id);

      if (isEndedStatus(status) && !wasEnded) {
        // The account's own address, not whichever one was typed at checkout.
        const email = profile.email || (typeof obj.customer === "object" ? obj.customer?.email : undefined);
        if (email) await sendSubscriptionEndedEmail(email, patch.numbersReleaseAt);
      }
    }
  }

  // Renewal: reset the minute pool. Creem reports every successful charge as
  // subscription.paid — including the first payment and the prorated charge of
  // a mid-cycle upgrade — so the pool is only reset when the billing period
  // has actually moved on. That also makes webhook retries harmless.
  if (eventType === "subscription.paid" || eventType === "subscription.renewed") {
    const periodStart = obj.current_period_start_date;
    const found = await findProfile(obj);
    // Add-on subscriptions renew too; only the plan subscription's cycle counts.
    const knownSub = found?.settings.creem_subscription_id;
    const isPlanSub = (!knownSub || knownSub === obj.id) && (!obj.product || !!planForProductId(creemEntityId(obj.product)));
    const lastPeriod = found?.settings.creem_period_start;

    if (found && isPlanSub && periodStart && !lastPeriod) {
      // First payment seen for this subscription: nothing to reset yet.
      await supabase
        .from("profiles")
        .update({ settings: { ...found.settings, creem_period_start: periodStart } })
        .eq("id", found.id);
    } else if (found && isPlanSub && (!periodStart || periodStart !== lastPeriod)) {
      const addons = found.settings.addons || {};
      const planBaseMinutes = planConfig(found.settings.plan || "essential").voiceMinutes;

      // Add-on minutes are one-time credits: blocks bought this cycle plus
      // whatever was carried over. Plan minutes are used first; the credits
      // that are left roll over, and the purchase itself does not repeat.
      const creditMinutes = (addons.minuteBlocks || 0) * 30 + (addons.rolloverMin || 0);
      const usedMin = Math.min(addons.usedMin || 0, planBaseMinutes + creditMinutes);
      const newRolloverMin = Math.max(0, creditMinutes - Math.max(0, usedMin - planBaseMinutes));

      await supabase
        .from("profiles")
        .update({
          settings: {
            ...found.settings,
            ...(periodStart ? { creem_period_start: periodStart } : {}),
            addons: {
              ...addons,
              usedMin: 0,
              minuteBlocks: 0,
              rolloverMin: newRolloverMin,
            },
          },
        })
        .eq("id", found.id);

      console.log(`Billing reset for ${found.id}: ${newRolloverMin} add-on min carried over`);
    }
  }

  return NextResponse.json({ received: true });
}
