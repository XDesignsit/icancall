import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { isSessionLive } from "@/lib/userSessions";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isPlanChangeChargedNow, type PlanId } from "@/lib/planConfig";
import {
  CREEM_API,
  PLAN_PRODUCT_IDS,
  creemEntityId,
  creemHeaders,
  isBillingCycle,
  isPlanId,
  isSimulatedBilling,
  planForProductId,
  type BillingCycle,
} from "@/lib/creem";

type Settings = Record<string, unknown>;

async function savePlan(userId: string, settings: Settings, patch: Settings): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...settings, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("change-plan: failed to persist plan:", error);
  return !error;
}

// Session → the account owner allowed to manage the subscription, or the
// error response to send back.
async function authorizeOwner(): Promise<{ userId: string; email: string } | NextResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const payload = sessionToken ? await verifySession(sessionToken) : null;
  if (!payload?.userId || (payload.sid && !(await isSessionLive(payload.sid)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The subscription belongs to the account owner; caregivers can't touch it.
  const resolved = await resolveAccount(payload.userId);
  if (resolved.role === "member") {
    return NextResponse.json(
      { error: "Caregivers can't change account or billing settings. Ask the account owner." },
      { status: 403 }
    );
  }
  return { userId: payload.userId, email: payload.email };
}

async function loadSettings(userId: string): Promise<Settings> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  return (profile?.settings as Settings) || {};
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
    return NextResponse.json({ mode: settings.creem_subscription_id ? "subscription" : "checkout" });
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
      if (settings.creem_subscription_id) {
        if (!isPlanId(settings.plan) || !isBillingCycle(settings.billingCycle)) {
          return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });
        }
        return NextResponse.json({ success: true, plan: settings.plan, billingCycle: settings.billingCycle, charged: true });
      }

      const res = await fetch(`${CREEM_API}/checkouts?checkout_id=${encodeURIComponent(String(body.checkoutId))}`, {
        headers: creemHeaders(),
      });
      if (!res.ok) {
        console.error("Creem checkout lookup error:", await res.text());
        return NextResponse.json({ error: "We couldn't verify your payment. If you were charged, your plan will update shortly." }, { status: 502 });
      }
      const checkout = await res.json();
      const paidFor = planForProductId(creemEntityId(checkout.product));
      const ownsCheckout =
        checkout.metadata?.user_id === userId ||
        (typeof checkout.customer?.email === "string" && checkout.customer.email.toLowerCase() === owner.email.toLowerCase());

      if (checkout.status !== "completed" || !paidFor || !ownsCheckout) {
        return NextResponse.json({ error: "This checkout has not been paid." }, { status: 402 });
      }

      const saved = await savePlan(userId, settings, {
        ...paidFor,
        creem_customer_id: creemEntityId(checkout.customer) ?? settings.creem_customer_id,
        creem_subscription_id: creemEntityId(checkout.subscription) ?? settings.creem_subscription_id,
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
      await savePlan(userId, settings, target);
      return NextResponse.json({ success: true, ...target, charged: false, simulated: true });
    }

    const productId = PLAN_PRODUCT_IDS[plan][billing];
    if (!productId) {
      console.error(`Creem product id missing for plan=${plan}/${billing} — set CREEM_PRODUCT_ID_${plan.toUpperCase()}_${billing.toUpperCase()}`);
      return NextResponse.json({ error: "This plan is not yet available for purchase" }, { status: 503 });
    }

    const subscriptionId = typeof settings.creem_subscription_id === "string" ? settings.creem_subscription_id : "";

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

    let res = await fetch(`${CREEM_API}/subscriptions/${encodeURIComponent(subscriptionId)}/upgrade`, {
      method: "POST",
      headers: creemHeaders(),
      body: JSON.stringify({
        product_id: productId,
        // Creem settles both directions right away: an upgrade charges the
        // prorated difference, a downgrade refunds the unused time to the
        // original payment method. ("proration-charge" is deprecated and
        // behaves the same.)
        update_behavior: "proration-charge-immediately",
      }),
    });

    let errText = "";
    if (!res.ok) {
      errText = await res.text();
      // If Creem cannot process a downgrade refund because it exceeds the
      // last in-cycle transaction amount, it returns "subscription_concurrent_change".
      // Fallback to "proration-none" so the downgrade succeeds immediately without
      // blocking the customer.
      if (!charged && errText.includes("subscription_concurrent_change")) {
        console.warn(`[Creem] Downgrade for ${subscriptionId} received subscription_concurrent_change with proration-charge-immediately; retrying with proration-none...`);
        res = await fetch(`${CREEM_API}/subscriptions/${encodeURIComponent(subscriptionId)}/upgrade`, {
          method: "POST",
          headers: creemHeaders(),
          body: JSON.stringify({
            product_id: productId,
            update_behavior: "proration-none",
          }),
        });
        if (!res.ok) {
          errText = await res.text();
        }
      }
    }

    if (!res.ok) {
      console.error(`Creem plan change error (${res.status}) for subscription ${subscriptionId}:`, errText);
      // Creem settles one change (e.g. an upgrade's prorated charge) before it
      // accepts the next; a second change moments later is refused, not failed.
      if (errText.includes("subscription_concurrent_change")) {
        return NextResponse.json(
          { error: "Your previous plan change is still being processed, so your plan was not changed. Please wait a few minutes and try again." },
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
