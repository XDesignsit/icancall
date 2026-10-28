import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { authorizeOwner, loadSettings } from "@/lib/billingOwner";
import { entityId, isSimulatedBilling, stripe, subscriptionPeriod } from "@/lib/stripe";
import { resetMinutesPool } from "@/lib/minutesCycle";
import { PET_TERMS, isPetsPlan } from "@/lib/pets";

// "Renew now" for Pets Annual (lib/pets): a line that ran out of its 30
// minutes for the year starts its next year today: $29 is charged now as its
// own invoice, then the subscription's billing year restarts from today
// (no proration, so the next yearly charge is a year away) and the minutes
// reset. Time left on the old year is not refunded. The reset also unlocks
// the voicemails left while the line was out of minutes. One-time pet terms have nothing to renew: their
// minutes reset on the purchase anniversary (api/cron/reset-annual-minutes).
export async function POST() {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    const settings = await loadSettings(owner.userId);

    if (!isPetsPlan(settings.plan) || settings.petTerm !== "annual") {
      return NextResponse.json({ error: "Only Pets Annual plans can be renewed early." }, { status: 400 });
    }

    // Demo accounts and unconfigured environments never reach the gateway.
    if (isSimulatedBilling(owner.email)) {
      const now = new Date().toISOString();
      const patch = { stripe_period_start: now, minutes_cycle_start: now, addons: resetMinutesPool(settings) };
      await supabase.from("profiles").update({ settings: { ...settings, ...patch } }).eq("id", owner.userId);
      console.warn("[MOCK] Simulating an early Pets Annual renewal: minutes reset, nothing charged.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const subscriptionId = typeof settings.stripe_subscription_id === "string" ? settings.stripe_subscription_id : "";
    if (!subscriptionId) {
      return NextResponse.json({ error: "We couldn't find your subscription. Please contact support." }, { status: 404 });
    }

    // 1. Charge the year now, as its own invoice on the card the subscription uses.
    //    A billing-anchor reset alone charges nothing (proration "none"), so the
    //    payment comes first and nothing else changes unless it succeeds.
    let invoiceId: string | undefined;
    try {
      const current = await stripe().subscriptions.retrieve(subscriptionId);
      const customer = entityId(current.customer);
      if (!customer) throw new Error("subscription has no customer");
      const invoice = await stripe().invoices.create({
        customer,
        collection_method: "charge_automatically",
        auto_advance: false,
        pending_invoice_items_behavior: "exclude",
        description: "Pets Annual: early renewal",
        metadata: { pets_early_renewal: subscriptionId },
        ...(entityId(current.default_payment_method) ? { default_payment_method: entityId(current.default_payment_method) } : {}),
      });
      invoiceId = invoice.id;
      await stripe().invoiceItems.create({ customer, invoice: invoice.id, amount: PET_TERMS.annual.amount * 100, currency: "usd", description: "Pets Annual, 1 year" });
      const paid = await stripe().invoices.pay(invoice.id!);
      if (paid.status !== "paid") throw new Error(`invoice ${invoice.id} is ${paid.status}`);
    } catch (err) {
      console.error(`Pets early renewal charge failed for ${subscriptionId}:`, err);
      if (invoiceId) await stripe().invoices.voidInvoice(invoiceId).catch(() => stripe().invoices.del(invoiceId!).catch(() => {}));
      return NextResponse.json(
        { error: "We couldn't renew your plan just now, so nothing was charged. Please check your card under Manage billing and try again." },
        { status: 402 }
      );
    }

    // 2. Start the new year today: the next yearly charge moves to a year from
    //    now (no proration, so nothing more is charged), and the minutes reset.
    //    Done here rather than in the webhook: this invoice is not the
    //    subscription's own, so invoice.paid does not reset anything.
    try {
      const sub = await stripe().subscriptions.update(subscriptionId, { billing_cycle_anchor: "now", proration_behavior: "none" });
      const periodStart = subscriptionPeriod(sub).start || new Date().toISOString();
      const patch = { stripe_period_start: periodStart, minutes_cycle_start: periodStart, addons: resetMinutesPool(settings) };
      await supabase.from("profiles").update({ settings: { ...settings, ...patch } }).eq("id", owner.userId);
      return NextResponse.json({ success: true, renewsAt: subscriptionPeriod(sub).end });
    } catch (err) {
      // Paid but not applied: log loudly so support can finish it by hand.
      console.error(`Pets early renewal PAID (invoice ${invoiceId}) but not applied for ${subscriptionId}:`, err);
      return NextResponse.json({ error: "Your payment went through, but we couldn't finish the renewal. Please contact support and we'll sort it out." }, { status: 500 });
    }
  } catch (err) {
    console.error("renew-pets error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
