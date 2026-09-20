import { NextRequest, NextResponse } from "next/server";
import { CREEM_API, PLAN_PRODUCT_IDS, creemHeaders, isBillingCycle, isPlanId, isSimulatedBilling, sessionIdentity } from "@/lib/creem";
import { ADDON_PRODUCT_IDS, MAX_ADDON_UNITS, isAddonId } from "@/lib/addons";
import { authorizeOwner, loadSettings } from "@/lib/billingOwner";
import { isEndedStatus } from "@/lib/subscriptionEnd";

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, addon, quantity, email } = await req.json();
    const units = Math.floor(Number(quantity) || 1);

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const appUrl = `${proto}://${host}`;

    let productId: string | undefined;
    let successUrl: string;

    if (addon) {
      if (!isAddonId(addon) || units < 1 || units > MAX_ADDON_UNITS) {
        return NextResponse.json({ error: "Invalid add-on type or quantity" }, { status: 400 });
      }
      // Add-ons are bought by the account owner, on top of a running plan. The
      // purchase is later credited to whoever metadata.user_id names
      // (api/creem/confirm-addon), so it must be a real signed-in owner.
      const owner = await authorizeOwner();
      if (owner instanceof NextResponse) return owner;
      if (!isSimulatedBilling(owner.email) && isEndedStatus((await loadSettings(owner.userId)).subscriptionStatus)) {
        return NextResponse.json({ error: "Your subscription has ended. Choose a plan before buying add-ons." }, { status: 409 });
      }
      productId = ADDON_PRODUCT_IDS[addon];
      successUrl = `${appUrl}/dashboard/addon-success?addon=${addon}&qty=${units}`;

      if (process.env.CREEM_API_KEY && !productId) {
        console.error(`Creem product id missing for add-on ${addon}`);
        return NextResponse.json({ error: "This add-on is not yet available for purchase" }, { status: 503 });
      }
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
    if (addon && units > 1) body.units = units;
    // Tie the purchase to the signed-in account so the webhook can match it
    // even if the customer pays with a different email address.
    // An email/password signup has no session yet, so the wizard sends the
    // address the account will be created under. Signup later checks the paid
    // checkout against these before it creates anything.
    const buyerEmail = identity?.email || (typeof email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? email.trim().toLowerCase() : "");
    if (buyerEmail) body.customer = { email: buyerEmail };
    const metadata: Record<string, string> = {};
    if (identity?.userId) metadata.user_id = identity.userId;
    if (buyerEmail) metadata.signup_email = buyerEmail;
    if (addon) metadata.addon = addon;
    if (Object.keys(metadata).length > 0) body.metadata = metadata;

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
