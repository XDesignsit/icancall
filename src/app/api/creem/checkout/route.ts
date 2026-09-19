import { NextRequest, NextResponse } from "next/server";
import { CREEM_API, PLAN_PRODUCT_IDS, creemHeaders, isBillingCycle, isPlanId, isSimulatedBilling, sessionIdentity } from "@/lib/creem";

const ADDON_PRODUCT_IDS: Record<string, string> = {
  phone_number:  process.env.CREEM_PRODUCT_ID_ADDON_PHONE_NUMBER!,
  voice_minutes: process.env.CREEM_PRODUCT_ID_ADDON_VOICE_MINUTES!,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, addon, quantity } = await req.json();

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const appUrl = `${proto}://${host}`;

    let productId: string | undefined;
    let successUrl: string;

    if (addon) {
      if (!(addon in ADDON_PRODUCT_IDS)) {
        return NextResponse.json({ error: "Invalid add-on type" }, { status: 400 });
      }
      productId = ADDON_PRODUCT_IDS[addon];
      successUrl = `${appUrl}/dashboard/addon-success?addon=${addon}&qty=${quantity || 1}`;
    } else {
      if (!isPlanId(plan) || !isBillingCycle(billing)) {
        return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
      }
      productId = PLAN_PRODUCT_IDS[plan][billing];
      successUrl = `${appUrl}/signup/creem-checkout?status=success`;

      // A configured environment with a missing product id must never fall
      // through to the simulated (free) checkout — fail loudly instead.
      if (process.env.CREEM_API_KEY && !productId) {
        console.error(`Creem product id missing for plan=${plan}/${billing} — set CREEM_PRODUCT_ID_${String(plan).toUpperCase()}_${String(billing).toUpperCase()}`);
        return NextResponse.json({ error: "This plan is not yet available for purchase" }, { status: 503 });
      }
    }

    // Demo accounts must never reach a real payment gateway, and local/preview
    // environments have no Creem credentials at all — both get a simulated
    // checkout that lands directly on the success URL so the normal post-payment
    // flow (success flag → apply add-ons → sync to DB) still runs end to end.
    const identity = await sessionIdentity();
    if (!productId || isSimulatedBilling(identity?.email)) {
      console.warn(`[MOCK] Simulating Creem checkout (${addon ? `addon=${addon}` : `plan=${plan}/${billing}`}) — redirecting straight to success URL.`);
      return NextResponse.json({
        checkoutUrl: successUrl,
        checkoutId: `mock_checkout_${Date.now()}`,
        simulated: true,
      });
    }

    const body: Record<string, unknown> = {
      product_id: productId,
      success_url: successUrl,
    };
    if (quantity && quantity > 1) body.units = quantity;
    // Tie the purchase to the signed-in account so the webhook can match it
    // even if the customer pays with a different email address.
    if (identity?.email) body.customer = { email: identity.email };
    if (identity?.userId) body.metadata = { user_id: identity.userId };

    const res = await fetch(`${CREEM_API}/checkouts`, {
      method: "POST",
      headers: creemHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Creem checkout error:", err);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ checkoutUrl: data.checkout_url, checkoutId: data.id });
  } catch (err) {
    console.error("Creem checkout exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
