import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { authorizeOwner, loadSettings, type Settings } from "@/lib/billingOwner";
import { REACTIVATED_PATCH, isEndedStatus } from "@/lib/subscriptionEnd";
import { isPlanChangeChargedNow, isScheduledPlanChange, planConfig, readPendingPlanChange, type PlanId } from "@/lib/planConfig";
import { releaseSchedule, scheduleSwitchAtPeriodEnd } from "@/lib/planSchedule";
import { paidExtraNumbers } from "@/lib/addons";
import {
  PLAN_PRICE_IDS,
  isBillingCycle,
  isPlanId,
  isSimulatedBilling,
  stripe,
  subscriptionItem,
  subscriptionLiveness,
  subscriptionPeriod,
  verifyPlanCheckout,
  type BillingCycle,
} from "@/lib/stripe";

async function savePlan(userId: string, settings: Settings, patch: Settings): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...settings, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("change-plan: failed to persist plan:", error);
  return !error;
}

// The subscription a plan change can act on. One that has ended (canceled /
// expired) cannot be upgraded or resumed at Stripe: the customer resubscribes
// through a checkout, exactly like an account that never had one.
function liveSubscriptionId(settings: Settings): string {
  if (isEndedStatus(settings.subscriptionStatus)) return "";
  return typeof settings.stripe_subscription_id === "string" ? settings.stripe_subscription_id : "";
}

// How a plan change will be billed for this account, so the dashboard can show
// an accurate notice before the customer commits:
//   simulated    → demo account / no Stripe credentials, nothing is charged
//   subscription → the existing subscription is switched in place
//   checkout     → no subscription on record, the plan is bought via checkout
export async function GET() {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    const settings = await loadSettings(owner.userId);
    const pending = readPendingPlanChange(settings);
    if (isSimulatedBilling(owner.email)) return NextResponse.json({ mode: "simulated", pending });
    const subscriptionId = liveSubscriptionId(settings);
    // Annual accounts are told when a switch to monthly would take effect,
    // before they confirm it: the end of the year already paid for.
    let periodEnd: string | undefined;
    if (subscriptionId && settings.billingCycle === "yearly") {
      try {
        periodEnd = subscriptionPeriod(await stripe().subscriptions.retrieve(subscriptionId)).end;
      } catch (err) {
        console.error(`Stripe period lookup failed for subscription ${subscriptionId}:`, err);
      }
    }
    return NextResponse.json({ mode: subscriptionId ? "subscription" : "checkout", pending, ...(periodEnd ? { periodEnd } : {}) });
  } catch (err) {
    console.error("Stripe change-plan exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Changes the plan and/or billing cycle of the signed-in owner's subscription.
//
//   { plan, billing }  → switches the existing Stripe subscription to the matching
//                        price. Accounts with no subscription on record get a
//                        `checkoutUrl` for a normal checkout instead.
//                        Annual → monthly (not an upgrade) does not switch now: it is
//                        scheduled for the end of the year already paid for, and
//                        answers `scheduled: true` with the pending change.
//   { cancelScheduled: true } → drops a change scheduled that way.
//   { checkoutId }     → called when that checkout returns to the dashboard:
//                        verifies the payment with Stripe and applies the plan
//                        without waiting for the webhook.
//
// The dashboard only adopts the new plan when this responds with success.
export async function POST(req: NextRequest) {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    const { userId } = owner;

    const body = await req.json().catch(() => ({}));

    const settings = await loadSettings(userId);
    const simulated = isSimulatedBilling(owner.email);

    // ── Take back a change scheduled for the end of the period ──
    if (body.cancelScheduled === true) {
      if (!simulated) {
        const subscriptionId = liveSubscriptionId(settings);
        if (subscriptionId) {
          try {
            await releaseSchedule(await stripe().subscriptions.retrieve(subscriptionId));
          } catch (err) {
            console.error(`Stripe schedule release error for subscription ${subscriptionId}:`, err);
            return NextResponse.json(
              { error: "We couldn't cancel the scheduled change, so nothing was changed. Please try again later or contact support." },
              { status: 502 }
            );
          }
        }
      }
      const saved = await savePlan(userId, settings, { pendingPlanChange: null });
      if (!saved) return NextResponse.json({ error: "We couldn't save the change. Please try again." }, { status: 500 });
      return NextResponse.json({ success: true, cancelledScheduled: true });
    }

    // ── Return leg of a checkout started below ──
    if (body.checkoutId) {
      if (simulated) return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });

      // Once a subscription is on record (this checkout already confirmed, or
      // the webhook got here first) the stored plan is the truth. Never
      // re-apply a checkout — an old one could be replayed after a downgrade
      // to get its plan back for free.
      if (liveSubscriptionId(settings)) {
        if (!isPlanId(settings.plan) || !isBillingCycle(settings.billingCycle)) {
          return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });
        }
        return NextResponse.json({ success: true, plan: settings.plan, billingCycle: settings.billingCycle, charged: true });
      }

      const check = await verifyPlanCheckout(String(body.checkoutId), { userId, email: owner.email });
      if (!check.ok) {
        return check.reason === "lookup_failed"
          ? NextResponse.json({ error: "We couldn't verify your payment. If you were charged, your plan will update shortly." }, { status: 502 })
          : NextResponse.json({ error: "This checkout has not been paid." }, { status: 402 });
      }
      const { customerId, subscriptionId: paidSubscriptionId, periodStart: paidPeriodStart, ...paidFor } = check.purchase;

      // Resubscribing after the old subscription ended: the checkout must have
      // opened a new subscription that is running now. Replaying the ended
      // subscription's own (completed) checkout must not bring the plan back.
      if (isEndedStatus(settings.subscriptionStatus)) {
        const fresh = !!paidSubscriptionId && paidSubscriptionId !== settings.stripe_subscription_id
          ? await subscriptionLiveness(paidSubscriptionId)
          : { state: "ended" as const };
        if (fresh.state !== "live") {
          return fresh.state === "unknown"
            ? NextResponse.json({ error: "We couldn't verify your payment. If you were charged, your plan will update shortly." }, { status: 502 })
            : NextResponse.json({ error: "This checkout has not been paid." }, { status: 402 });
        }
      }

      const saved = await savePlan(userId, settings, {
        // A running subscription stops the number-release clock.
        ...REACTIVATED_PATCH,
        ...paidFor,
        stripe_customer_id: customerId ?? settings.stripe_customer_id,
        stripe_subscription_id: paidSubscriptionId ?? settings.stripe_subscription_id,
        // The new subscription's period, so its first renewal resets the minutes.
        ...(paidPeriodStart ? { stripe_period_start: paidPeriodStart } : {}),
      });
      if (!saved) return NextResponse.json({ error: "Payment received, but we couldn't update your plan. Please contact support." }, { status: 500 });
      return NextResponse.json({ success: true, ...paidFor, charged: true });
    }

    // ── Plan / billing-cycle switch ──
    const { plan, billing } = body as { plan?: unknown; billing?: unknown };
    if (!isPlanId(plan) || !isBillingCycle(billing)) {
      return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
    }
    const target = { plan, billingCycle: billing };

    // Demo accounts and unconfigured environments never reach the gateway.
    if (simulated) {
      console.warn(`[MOCK] Simulating Stripe plan change to ${plan}/${billing} — no subscription was modified.`);
      await savePlan(userId, settings, { ...(isEndedStatus(settings.subscriptionStatus) ? REACTIVATED_PATCH : {}), ...target, pendingPlanChange: null });
      return NextResponse.json({ success: true, ...target, charged: false, simulated: true });
    }

    // A plan has to cover the numbers the account holds (its included lines
    // plus paid extra-number add-ons). Otherwise a customer could fill Care
    // Team's five lines and then pay for Essential's one.
    const { data: heldRows } = await supabase.from("phone_lines").select("number").eq("user_id", userId);
    const heldLines = (heldRows || []).length;
    const room = planConfig(plan).includedLines + (isEndedStatus(settings.subscriptionStatus) ? 0 : paidExtraNumbers(settings));
    if (heldLines > room) {
      return NextResponse.json(
        { error: `That plan covers ${room} phone number${room === 1 ? "" : "s"} and this account has ${heldLines}. Remove a number first, or choose a larger plan.` },
        { status: 409 }
      );
    }

    const priceId = PLAN_PRICE_IDS[plan][billing];
    if (!priceId) {
      console.error(`Stripe price id missing for plan=${plan}/${billing} — set STRIPE_PRICE_ID_${plan.toUpperCase()}_${billing.toUpperCase()}`);
      return NextResponse.json({ error: "This plan is not yet available for purchase" }, { status: 503 });
    }

    const subscriptionId = liveSubscriptionId(settings);

    // No subscription on record: there is nothing to upgrade, so the customer
    // buys the plan through a normal checkout and comes back to the dashboard.
    if (!subscriptionId) {
      const host = req.headers.get("host") || "localhost:3000";
      const proto = host.startsWith("localhost") ? "http" : "https";
      const metadata = { user_id: userId, signup_email: owner.email };
      try {
        const session = await stripe().checkout.sessions.create({
          mode: "subscription",
          managed_payments: { enabled: false },
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${proto}://${host}/dashboard?view=account&plan_change=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${proto}://${host}/dashboard?view=account`,
          ...(typeof settings.stripe_customer_id === "string" && settings.stripe_customer_id
            ? { customer: settings.stripe_customer_id }
            : { customer_email: owner.email }),
          client_reference_id: userId,
          metadata,
          subscription_data: { metadata },
          integration_identifier: "icancall_plan_change_ktwmbzrq",
        });
        return NextResponse.json({ requiresCheckout: true, checkoutUrl: session.url });
      } catch (err) {
        console.error("Stripe checkout error:", err);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
      }
    }

    const current = {
      plan: (isPlanId(settings.plan) ? settings.plan : "essential") as PlanId,
      billingCycle: (isBillingCycle(settings.billingCycle) ? settings.billingCycle : "monthly") as BillingCycle,
    };
    const charged = isPlanChangeChargedNow(current, target);
    const sameAsCurrent = current.plan === target.plan && current.billingCycle === target.billingCycle;

    try {
      const sub = await stripe().subscriptions.retrieve(subscriptionId);

      // Choosing what the account already has takes back a scheduled change.
      if (sameAsCurrent) {
        await releaseSchedule(sub);
        await savePlan(userId, settings, { pendingPlanChange: null });
        return NextResponse.json({ success: true, ...target, charged: false, cancelledScheduled: true });
      }

      // Annual → monthly waits for the end of the year already paid for.
      if (isScheduledPlanChange(current, target)) {
        if (settings.subscriptionStatus === "scheduled_cancel") {
          return NextResponse.json(
            { error: "Your subscription is set to end. Resume it before scheduling a plan change." },
            { status: 409 }
          );
        }
        const effectiveAt = await scheduleSwitchAtPeriodEnd(sub, priceId);
        const pending = { ...target, effectiveAt, scheduledAt: new Date().toISOString() };
        const saved = await savePlan(userId, settings, { pendingPlanChange: pending });
        if (!saved) {
          await releaseSchedule(await stripe().subscriptions.retrieve(subscriptionId)).catch(() => {});
          return NextResponse.json({ error: "We couldn't save the change. Nothing was changed. Please try again." }, { status: 500 });
        }
        return NextResponse.json({ success: true, scheduled: true, ...current, pending, charged: false });
      }

      // Any other change replaces a scheduled one, and Stripe will not edit a
      // subscription that a schedule still manages.
      await releaseSchedule(sub);

      const item = subscriptionItem(sub);
      if (!item.itemId) throw new Error("subscription has no items");
      // Upgrades charge the prorated difference right away, and the change is
      // refused (error_if_incomplete) if that payment fails. Downgrades take
      // effect now with no proration: the lower price starts at the next
      // billing date and nothing is charged or refunded. Changing between
      // monthly and yearly restarts the billing cycle, so a downgrade that
      // does so credits the unused time against the new price instead.
      const intervalChanges = current.billingCycle !== target.billingCycle;
      const updated = await stripe().subscriptions.update(subscriptionId, {
        items: [{ id: item.itemId, price: priceId }],
        proration_behavior: charged ? "always_invoice" : intervalChanges ? "create_prorations" : "none",
        payment_behavior: "error_if_incomplete",
      });
      if (subscriptionItem(updated).priceId !== priceId) {
        console.error(`Stripe plan change returned an unexpected price for subscription ${subscriptionId}:`, subscriptionItem(updated).priceId);
        return NextResponse.json({ error: "We couldn't confirm the change with our payment provider. Your plan was not changed." }, { status: 502 });
      }
    } catch (err) {
      console.error(`Stripe plan change error for subscription ${subscriptionId}:`, err);
      // A declined card on the prorated charge is the customer's to fix; anything
      // else (bad key, missing permission, outage) is ours.
      if (err instanceof Stripe.errors.StripeCardError) {
        return NextResponse.json(
          { error: "We couldn't charge your payment method, so your plan was not changed. Please update your payment method and try again." },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: "We couldn't update your subscription, so your plan was not changed. Please try again later or contact support." },
        { status: 502 }
      );
    }

    // Stripe has switched the subscription. If this write fails, the
    // customer.subscription.updated webhook applies the same plan moments later.
    await savePlan(userId, settings, { ...target, pendingPlanChange: null });
    return NextResponse.json({ success: true, ...target, charged });
  } catch (err) {
    console.error("Stripe change-plan exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
