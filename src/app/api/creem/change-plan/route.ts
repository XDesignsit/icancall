import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { authorizeOwner, loadSettings, type Settings } from "@/lib/billingOwner";
import { REACTIVATED_PATCH, isEndedStatus } from "@/lib/subscriptionEnd";
import { isPlanChangeChargedNow, type PlanId } from "@/lib/planConfig";
import {
  CREEM_API,
  PLAN_PRODUCT_IDS,
  creemEntityId,
  creemHeaders,
  isBillingCycle,
  isPlanId,
  isSimulatedBilling,
  subscriptionLiveness,
  verifyPlanCheckout,
  type BillingCycle,
} from "@/lib/creem";

async function savePlan(userId: string, settings: Settings, patch: Settings): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...settings, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("change-plan: failed to persist plan:", error);
  return !error;
}

// The subscription a plan change can act on. One that has ended (canceled /
// expired) cannot be upgraded or resumed at Creem: the customer resubscribes
// through a checkout, exactly like an account that never had one.
function liveSubscriptionId(settings: Settings): string {
  if (isEndedStatus(settings.subscriptionStatus)) return "";
  return typeof settings.creem_subscription_id === "string" ? settings.creem_subscription_id : "";
}

// How a plan change will be billed for this account, so the dashboard can show
// an accurate notice before the customer commits:
//   simulated    → demo account / no Creem credentials, nothing is charged
//   subscription → the existing subscription is switched in place
//   checkout     → no subscription on record, the plan is bought via checkout
export async function GET() {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    if (isSimulatedBilling(owner.email)) return NextResponse.json({ mode: "simulated" });
    const settings = await loadSettings(owner.userId);
    return NextResponse.json({ mode: liveSubscriptionId(settings) ? "subscription" : "checkout" });
  } catch (err) {
    console.error("Creem change-plan exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Changes the plan and/or billing cycle of the signed-in owner's subscription.
//
//   { plan, billing }  → switches the existing Creem subscription to the matching
//                        product. Accounts with no subscription on record get a
//                        `checkoutUrl` for a normal checkout instead.
//   { checkoutId }     → called when that checkout returns to the dashboard:
//                        verifies the payment with Creem and applies the plan
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
      const { customerId, subscriptionId: paidSubscriptionId, ...paidFor } = check.purchase;

      // Resubscribing after the old subscription ended: the checkout must have
      // opened a new subscription that is running now. Replaying the ended
      // subscription's own (completed) checkout must not bring the plan back.
      if (isEndedStatus(settings.subscriptionStatus)) {
        const fresh = !!paidSubscriptionId && paidSubscriptionId !== settings.creem_subscription_id
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
        creem_customer_id: customerId ?? settings.creem_customer_id,
        creem_subscription_id: paidSubscriptionId ?? settings.creem_subscription_id,
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
      console.warn(`[MOCK] Simulating Creem plan change to ${plan}/${billing} — no subscription was modified.`);
      await savePlan(userId, settings, isEndedStatus(settings.subscriptionStatus) ? { ...REACTIVATED_PATCH, ...target } : target);
      return NextResponse.json({ success: true, ...target, charged: false, simulated: true });
    }

    const productId = PLAN_PRODUCT_IDS[plan][billing];
    if (!productId) {
      console.error(`Creem product id missing for plan=${plan}/${billing} — set CREEM_PRODUCT_ID_${plan.toUpperCase()}_${billing.toUpperCase()}`);
      return NextResponse.json({ error: "This plan is not yet available for purchase" }, { status: 503 });
    }

    const subscriptionId = liveSubscriptionId(settings);

    // No subscription on record: there is nothing to upgrade, so the customer
    // buys the plan through a normal checkout and comes back to the dashboard.
    if (!subscriptionId) {
      const host = req.headers.get("host") || "localhost:3000";
      const proto = host.startsWith("localhost") ? "http" : "https";
      const res = await fetch(`${CREEM_API}/checkouts`, {
        method: "POST",
        headers: creemHeaders(),
        body: JSON.stringify({
          product_id: productId,
          success_url: `${proto}://${host}/dashboard?view=account&plan_change=success`,
          customer: { email: owner.email },
          metadata: { user_id: userId },
        }),
      });
      if (!res.ok) {
        console.error("Creem checkout error:", await res.text());
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({ requiresCheckout: true, checkoutUrl: data.checkout_url });
    }

    const current = {
      plan: (isPlanId(settings.plan) ? settings.plan : "essential") as PlanId,
      billingCycle: (isBillingCycle(settings.billingCycle) ? settings.billingCycle : "monthly") as BillingCycle,
    };
    const charged = isPlanChangeChargedNow(current, target);

    const res = await fetch(`${CREEM_API}/subscriptions/${encodeURIComponent(subscriptionId)}/upgrade`, {
      method: "POST",
      headers: creemHeaders(),
      body: JSON.stringify({
        product_id: productId,
        // Upgrades charge the prorated difference right away. Downgrades take
        // effect now with no proration: the lower price starts at the next
        // billing date and nothing is refunded. Creem's refunding mode is not
        // usable here — it can only refund against the single most recent
        // charge, and refuses (subscription_concurrent_change) whenever the
        // refund is larger, e.g. after an upgrade earlier in the same period.
        update_behavior: charged ? "proration-charge-immediately" : "proration-none",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Creem plan change error (${res.status}) for subscription ${subscriptionId}:`, errText);
      // Creem could not fit this change onto the subscription's current billing
      // state. It is not a payment failure and does not clear by waiting.
      if (errText.includes("subscription_concurrent_change")) {
        return NextResponse.json(
          { error: "We couldn't apply this change to your subscription right now, so your plan was not changed. Please contact support and we'll sort it out." },
          { status: 409 }
        );
      }
      // 401/403 is our own misconfiguration (bad key, or a scoped key without
      // subscription write access) — don't send the customer off to check a
      // payment method that was never tried.
      if (res.status === 401 || res.status === 403) {
        console.error("CREEM_API_KEY cannot modify subscriptions — it needs the subscriptions write scope.");
        return NextResponse.json(
          { error: "Plan changes are temporarily unavailable, so your plan was not changed. Please try again later or contact support." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "We couldn't update your subscription, so your plan was not changed. Please check your payment method and try again." },
        { status: 502 }
      );
    }

    const subscription = await res.json();
    if (creemEntityId(subscription.product) !== productId) {
      console.error(`Creem plan change returned an unexpected product for subscription ${subscriptionId}:`, creemEntityId(subscription.product));
      return NextResponse.json({ error: "We couldn't confirm the change with our payment provider. Your plan was not changed." }, { status: 502 });
    }

    // Creem has switched the subscription. If this write fails, the
    // subscription.update webhook applies the same plan moments later.
    await savePlan(userId, settings, target);
    return NextResponse.json({ success: true, ...target, charged });
  } catch (err) {
    console.error("Creem change-plan exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
