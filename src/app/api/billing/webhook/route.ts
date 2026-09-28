import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { appSubscriptionStatus, entityId, planForPriceId, retrieveCheckoutSession, stripe, subscriptionItem, subscriptionPeriod } from "@/lib/stripe";
import { resetMinutesPool } from "@/lib/minutesCycle";
import { REACTIVATED_PATCH, endedPatch, isEndedStatus, sendSubscriptionEndedEmail } from "@/lib/subscriptionEnd";
import { MAX_ADDON_UNITS, addonForPriceId, addonSubscriptions, creditAddonPurchase, followPlanSubscription, paidExtraNumbers } from "@/lib/addons";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Profile = { id: string; email?: string; settings: Settings };

// Checkouts started by a signed-in user carry metadata.user_id (copied onto the
// subscription); anything else is matched on the Stripe customer id we already
// recorded, then on the customer's email.
async function findProfile(hint: { userId?: unknown; customerId?: string; email?: string | null }): Promise<Profile | null> {
  const select = "id, email, settings";
  const shape = (data: { id: string; email: string | null; settings: Settings | null }): Profile =>
    ({ id: data.id, email: data.email || undefined, settings: data.settings || {} });

  if (typeof hint.userId === "string" && hint.userId) {
    const { data } = await supabase.from("profiles").select(select).eq("id", hint.userId).maybeSingle();
    if (data) return shape(data);
  }
  if (hint.customerId) {
    const { data } = await supabase.from("profiles").select(select).eq("settings->>stripe_customer_id", hint.customerId).maybeSingle();
    if (data) return shape(data);
  }
  let email = hint.email;
  if (!email && hint.customerId) {
    const customer = await stripe().customers.retrieve(hint.customerId);
    if (!customer.deleted) email = customer.email;
  }
  if (email) {
    const { data } = await supabase.from("profiles").select(select).eq("email", email).maybeSingle();
    if (data) return shape(data);
  }
  return null;
}

const subscriptionProfile = (sub: Stripe.Subscription) =>
  findProfile({ userId: sub.metadata?.user_id, customerId: entityId(sub.customer) });

/** The subscription id an invoice bills, wherever this API version keeps it. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  return entityId(invoice.parent?.subscription_details?.subscription);
}

async function onCheckoutCompleted(sessionId: string): Promise<void> {
  const found = await retrieveCheckoutSession(sessionId);
  if (!found?.paid) return;
  const { session, subscription, item } = found;
  const customerId = entityId(session.customer);
  if (!customerId) return;

  const boughtPlan = planForPriceId(item.priceId);
  const boughtAddon = addonForPriceId(item.priceId);
  const subscriptionId = subscription?.id;

  console.log(`Stripe checkout.session.completed — customer: ${customerId}, subscription: ${subscriptionId ?? "n/a"}, plan: ${boughtPlan ? `${boughtPlan.plan}/${boughtPlan.billingCycle}` : "n/a"}`);

  const profile = await findProfile({ userId: session.metadata?.user_id, customerId, email: session.customer_details?.email });
  if (!profile) return;

  if (boughtAddon && session.metadata?.user_id === profile.id) {
    // Same crediting as api/billing/confirm-addon, for the customer who paid
    // and closed the window before the dashboard could confirm. Once per
    // checkout, whichever of the two gets here first.
    const units = Math.min(MAX_ADDON_UNITS, Math.max(1, Math.floor(Number(item.units) || 1)));
    await creditAddonPurchase(profile.id, profile.settings, session.id, { addon: boughtAddon, units, customerId, subscriptionId });
  } else if (boughtPlan && subscriptionId) {
    // Only a plan purchase defines the account's subscription and plan.
    // Add-on checkouts must not replace the id that plan changes target.
    await supabase
      .from("profiles")
      .update({ settings: { ...profile.settings, stripe_customer_id: customerId, ...boughtPlan, stripe_subscription_id: subscriptionId } })
      .eq("id", profile.id);
  }
}

// Keeps plan/billingCycle and the subscription's state in step with Stripe,
// whoever changed it: the dashboard (api/billing/change-plan and cancel), the
// Stripe customer portal, a failed renewal, or the Stripe Dashboard. Works from
// a fresh read of the subscription, since events can arrive out of order.
async function onSubscriptionChanged(eventType: string, sub: Stripe.Subscription): Promise<void> {
  const profile = await subscriptionProfile(sub);
  if (!profile) return;
  const s = profile.settings;
  const { priceId } = subscriptionItem(sub);
  const subPlan = planForPriceId(priceId);
  const knownSub = s.stripe_subscription_id;
  const status = appSubscriptionStatus(sub);
  const { end: periodEnd } = subscriptionPeriod(sub);

  if (subPlan && sub.status !== "incomplete" && sub.status !== "incomplete_expired" && (!knownSub || knownSub === sub.id)) {
    if (s.plan !== subPlan.plan || s.billingCycle !== subPlan.billingCycle || !knownSub) {
      console.log(`Stripe ${eventType} — syncing ${profile.id} to ${subPlan.plan}/${subPlan.billingCycle}`);
      await supabase
        .from("profiles")
        .update({
          settings: {
            ...s,
            ...subPlan,
            stripe_subscription_id: sub.id,
            stripe_customer_id: entityId(sub.customer) ?? s.stripe_customer_id,
          },
        })
        .eq("id", profile.id);
      Object.assign(s, subPlan, { stripe_subscription_id: sub.id, stripe_customer_id: entityId(sub.customer) ?? s.stripe_customer_id });
    }
  }

  // Add-on subscriptions have their own lifecycle; only the plan's counts here.
  const isPlanSub = !!s.stripe_subscription_id && s.stripe_subscription_id === sub.id;

  // An extra-number add-on that ended on its own (customer portal, failed
  // renewal): it is no longer paid for, so it no longer raises the allowance.
  const addonSub = !isPlanSub ? addonSubscriptions(s).find((a) => a.id === sub.id) : undefined;
  if (addonSub && addonSub.status !== "canceled" && isEndedStatus(status)) {
    console.log(`Stripe ${eventType} — ${profile.id} add-on subscription ${sub.id} ended (${addonSub.units} number(s))`);
    await supabase
      .from("profiles")
      .update({
        settings: {
          ...s,
          addons: { ...(s.addons || {}), extraNumbers: Math.max(0, paidExtraNumbers(s) - addonSub.units) },
          addonSubscriptions: addonSubscriptions(s).map((a) => (a.id === sub.id ? { ...a, status: "canceled", units: 0 } : a)),
        },
      })
      .eq("id", profile.id);
  }

  if (isPlanSub && sub.status !== "incomplete" && s.subscriptionStatus !== status) {
    console.log(`Stripe ${eventType} — ${profile.id} subscription is now ${status}`);
    const wasEnded = isEndedStatus(s.subscriptionStatus);
    // Ended: calls keep routing and the numbers are held for the grace
    // period (src/lib/subscriptionEnd.ts), then released by the daily job.
    // Running again: the clock stops and nothing is released.
    const patch = isEndedStatus(status)
      ? endedPatch(s, status)
      : status === "active" || status === "trialing"
        ? REACTIVATED_PATCH
        : { subscriptionStatus: status, subscriptionEndsAt: periodEnd ?? s.subscriptionEndsAt ?? null };
    // Add-on subscriptions follow the plan, however it was cancelled or
    // brought back (the dashboard does the same in api/billing/cancel-subscription).
    const addonPatch = isEndedStatus(status)
      ? await followPlanSubscription(s, "immediate")
      : status === "scheduled_cancel"
        ? await followPlanSubscription(s, "scheduled")
        : status === "active" && s.subscriptionStatus === "scheduled_cancel"
          ? await followPlanSubscription(s, "resume")
          : {};
    await supabase
      .from("profiles")
      .update({ settings: { ...s, ...patch, ...addonPatch } })
      .eq("id", profile.id);

    if (isEndedStatus(status) && !wasEnded) {
      // The account's own address, not whichever one was typed at checkout.
      const email = profile.email;
      if (email) await sendSubscriptionEndedEmail(email, patch.numbersReleaseAt);
    }
  }
}

// Renewal: reset the minute pool. invoice.paid fires for every successful
// charge — including the first payment and the prorated charge of a mid-cycle
// upgrade — so the pool is only reset when the billing period has actually
// moved on. That also makes webhook retries harmless.
async function onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const found = await subscriptionProfile(sub);
  if (!found) return;

  const periodStart = subscriptionPeriod(sub).start;
  // Add-on subscriptions renew too; only the plan subscription's cycle counts.
  const knownSub = found.settings.stripe_subscription_id;
  const isPlanSub = (!knownSub || knownSub === sub.id) && !!planForPriceId(subscriptionItem(sub).priceId);
  const lastPeriod = found.settings.stripe_period_start;

  if (isPlanSub && periodStart && !lastPeriod) {
    // First payment seen for this subscription: nothing to reset yet.
    await supabase
      .from("profiles")
      .update({ settings: { ...found.settings, stripe_period_start: periodStart } })
      .eq("id", found.id);
  } else if (isPlanSub && periodStart && periodStart !== lastPeriod) {
    const addons = resetMinutesPool(found.settings);

    await supabase
      .from("profiles")
      .update({
        settings: {
          ...found.settings,
          stripe_period_start: periodStart,
          minutes_cycle_start: periodStart,
          addons,
        },
      })
      .eq("id", found.id);

    console.log(`Billing reset for ${found.id}: ${addons.rolloverMin} add-on min carried over`);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) {
    console.error("Stripe webhook called but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are not both set.");
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await onCheckoutCompleted(event.data.object.id);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = await stripe().subscriptions.retrieve(event.data.object.id);
        await onSubscriptionChanged(event.type, sub);
        break;
      }
      case "invoice.paid":
        await onInvoicePaid(event.data.object);
        break;
    }
  } catch (err) {
    // A non-2xx makes Stripe retry, which is what we want for a transient failure.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
