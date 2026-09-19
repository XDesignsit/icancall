import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { authorizeOwner, loadSettings, type Settings } from "@/lib/billingOwner";
import { CREEM_API, creemHeaders, isSimulatedBilling } from "@/lib/creem";

async function saveStatus(userId: string, settings: Settings, patch: Settings): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...settings, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("cancel-subscription: failed to persist status:", error);
}

// Cancels the signed-in owner's subscription at the end of the period already
// paid for — the plan and its numbers stay active until then and nothing more
// is charged — or takes that cancellation back while it is still pending.
//
//   { action: "cancel" }  → Creem cancel, mode "scheduled"
//   { action: "resume" }  → Creem resume (only from scheduled_cancel)
//
// The dashboard only shows the new state when this responds with success.
export async function POST(req: NextRequest) {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    const { userId } = owner;

    const { action } = (await req.json().catch(() => ({}))) as { action?: unknown };
    if (action !== "cancel" && action !== "resume") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const settings = await loadSettings(userId);

    // Demo accounts and unconfigured environments never reach the gateway.
    if (isSimulatedBilling(owner.email)) {
      console.warn(`[MOCK] Simulating Creem subscription ${action} — no subscription was modified.`);
      const patch = action === "cancel"
        ? { subscriptionStatus: "scheduled_cancel", subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
        : { subscriptionStatus: "active", subscriptionEndsAt: null };
      await saveStatus(userId, settings, patch);
      return NextResponse.json({ success: true, ...patch, simulated: true });
    }

    const subscriptionId = typeof settings.creem_subscription_id === "string" ? settings.creem_subscription_id : "";
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "We couldn't find an active subscription on this account. Please contact support and we'll sort it out." },
        { status: 404 }
      );
    }

    const res = await fetch(`${CREEM_API}/subscriptions/${encodeURIComponent(subscriptionId)}/${action}`, {
      method: "POST",
      headers: creemHeaders(),
      // "scheduled": the subscription runs to the end of the paid period and
      // then ends, rather than stopping (and cutting off the numbers) today.
      body: action === "cancel" ? JSON.stringify({ mode: "scheduled", onExecute: "cancel" }) : undefined,
    });

    if (!res.ok) {
      console.error(`Creem subscription ${action} error (${res.status}) for ${subscriptionId}:`, await res.text());
      if (res.status === 401 || res.status === 403) {
        console.error("CREEM_API_KEY cannot modify subscriptions — it needs the subscriptions write scope.");
      }
      return NextResponse.json(
        {
          error: action === "cancel"
            ? "We couldn't cancel your subscription just now, so nothing was changed. Please try again, or contact support and we'll cancel it for you."
            : "We couldn't restore your subscription just now, so nothing was changed. Please try again or contact support.",
        },
        { status: 502 }
      );
    }

    const subscription = await res.json();
    const expected = action === "cancel" ? "scheduled_cancel" : "active";
    if (subscription.status !== expected && !(action === "cancel" && subscription.status === "canceled")) {
      console.error(`Creem subscription ${action} returned unexpected status for ${subscriptionId}:`, subscription.status);
      return NextResponse.json({ error: "We couldn't confirm the change with our payment provider. Nothing was changed." }, { status: 502 });
    }

    const patch = action === "cancel"
      ? { subscriptionStatus: subscription.status as string, subscriptionEndsAt: (subscription.current_period_end_date as string) || null }
      : { subscriptionStatus: "active", subscriptionEndsAt: null };
    // If this write fails, the subscription.scheduled_cancel / subscription.active
    // webhook records the same state moments later.
    await saveStatus(userId, settings, patch);
    return NextResponse.json({ success: true, ...patch });
  } catch (err) {
    console.error("Creem cancel-subscription exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
