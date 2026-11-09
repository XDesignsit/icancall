import { NextRequest, NextResponse } from "next/server";
import { PLAN_PRICE_IDS, isBillingCycle, isPlanId, isSimulatedBilling, sessionIdentity, signupsPaused, stripe } from "@/lib/stripe";
import { ADDON_PRICE_IDS, MAX_ADDON_UNITS, isAddonId } from "@/lib/addons";
import { authorizeOwner, loadSettings } from "@/lib/billingOwner";
import { isEndedStatus } from "@/lib/subscriptionEnd";
import { PETS_REFUND_POLICY_NOTE, PET_PRICE_IDS, PET_TERMS, isPetTerm, isPetsPlan } from "@/lib/pets";

// Stripe replaces the placeholder with the session id, so the return page can
// hand it to the server, which verifies it before crediting anything.
const SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";
// Same wording as the FAQ and Terms. Plans only: add-on numbers and minutes aren't refundable.
const REFUND_POLICY_NOTE =
  "Refund policy: if iCanCall doesn't work, contact support@icancall.co within 14 days of purchase. If we can't fix it, you get a full refund. If you change your mind within 14 days, you get half of your first month back on a monthly plan, or the annual charge minus one month on an annual plan.";

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, addon, quantity, email, term } = await req.json();
    const units = Math.floor(Number(quantity) || 1);

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const appUrl = `${proto}://${host}`;

    let priceId: string | undefined;
    let successUrl: string;
    let cancelUrl: string;
    let existingCustomerId: string | undefined;
    // One-time pet terms are paid once ("payment" mode); Pets Annual is a yearly subscription.
    let oneTimePlan = false;

    if (addon) {
      if (!isAddonId(addon) || units < 1 || units > MAX_ADDON_UNITS) {
        return NextResponse.json({ error: "Invalid add-on type or quantity" }, { status: 400 });
      }
      // Add-ons are bought by the account owner, on top of a running plan. The
      // purchase is later credited to whoever metadata.user_id names
      // (api/billing/confirm-addon), so it must be a real signed-in owner.
      const owner = await authorizeOwner();
      if (owner instanceof NextResponse) return owner;
      const settings = await loadSettings(owner.userId);
      // Pet plans include no add-ons (lib/pets).
      if (isPetsPlan(settings.plan)) {
        return NextResponse.json({ error: "Add-ons are not available on pet plans." }, { status: 409 });
      }
      if (!isSimulatedBilling(owner.email) && isEndedStatus(settings.subscriptionStatus)) {
        return NextResponse.json({ error: "Your subscription has ended. Choose a plan before buying add-ons." }, { status: 409 });
      }
      if (typeof settings.stripe_customer_id === "string") existingCustomerId = settings.stripe_customer_id;
      priceId = ADDON_PRICE_IDS[addon];
      successUrl = `${appUrl}/dashboard/addon-success?addon=${addon}&qty=${units}&session_id=${SESSION_PLACEHOLDER}`;
      cancelUrl = `${appUrl}/dashboard?view=account`;

      if (process.env.STRIPE_SECRET_KEY && !priceId) {
        console.error(`Stripe price id missing for add-on ${addon}`);
        return NextResponse.json({ error: "This add-on is not yet available for purchase" }, { status: 503 });
      }
    } else {
      if (!isPlanId(plan) || !isBillingCycle(billing)) {
        return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
      }
      if (isPetsPlan(plan) && !isPetTerm(term)) {
        return NextResponse.json({ error: "Invalid pet plan" }, { status: 400 });
      }
      if (signupsPaused()) {
        return NextResponse.json({ error: "Signups open soon. Please check back shortly." }, { status: 503 });
      }
      oneTimePlan = isPetsPlan(plan) && PET_TERMS[term as keyof typeof PET_TERMS].oneTime;
      priceId = isPetsPlan(plan) ? PET_PRICE_IDS[term as keyof typeof PET_PRICE_IDS] : PLAN_PRICE_IDS[plan][billing];
      successUrl = `${appUrl}/signup/checkout-complete?status=success&session_id=${SESSION_PLACEHOLDER}`;
      cancelUrl = `${appUrl}/signup/checkout-complete?status=cancel`;

      // A configured environment with a missing price id must never fall
      // through to the simulated (free) checkout — fail loudly instead.
      if (process.env.STRIPE_SECRET_KEY && !priceId) {
        console.error(isPetsPlan(plan)
          ? `Stripe price id missing for pets/${term} — set STRIPE_PRICE_ID_PETS_${String(term).toUpperCase()}`
          : `Stripe price id missing for plan=${plan}/${billing} — set STRIPE_PRICE_ID_${String(plan).toUpperCase()}_${String(billing).toUpperCase()}`);
        return NextResponse.json({ error: "This plan is not yet available for purchase" }, { status: 503 });
      }
    }

    // Demo accounts must never reach a real payment gateway, and local/preview
    // environments have no Stripe credentials at all — both get a simulated
    // checkout that lands directly on the success URL so the normal post-payment
    // flow (success flag → apply add-ons → sync to DB) still runs end to end.
    const identity = await sessionIdentity();
    if (!priceId || isSimulatedBilling(identity?.email)) {
      console.warn(`[MOCK] Simulating Stripe checkout (${addon ? `addon=${addon}` : `plan=${plan}/${billing}`}) — redirecting straight to success URL.`);
      return NextResponse.json({
        checkoutUrl: successUrl.replace(SESSION_PLACEHOLDER, "mock_checkout"),
        checkoutId: `mock_checkout_${Date.now()}`,
        simulated: true,
      });
    }

    // Tie the purchase to the signed-in account so the webhook can match it
    // even if the customer pays with a different email address.
    // An email/password signup has no session yet, so the wizard sends the
    // address the account will be created under. Signup later checks the paid
    // checkout against these before it creates anything.
    const buyerEmail = identity?.email || (typeof email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? email.trim().toLowerCase() : "");
    const metadata: Record<string, string> = {};
    if (identity?.userId) metadata.user_id = identity.userId;
    if (buyerEmail) metadata.signup_email = buyerEmail;
    if (addon) metadata.addon = addon;
    if (isPetsPlan(plan) && !addon) metadata.pet_term = String(term);

    // Voice-minute blocks and one-time pet terms are paid once; everything else recurs.
    const oneTime = addon === "voice_minutes" || oneTimePlan;
    const session = await stripe().checkout.sessions.create({
      mode: oneTime ? "payment" : "subscription",
      // Opt out of Managed Payments (Stripe as merchant of record, digital goods
      // only): new Stripe accounts have it on by default and it rejects
      // products without a tax code. Explicit so live behaves like the sandbox.
      managed_payments: { enabled: false },
      line_items: [{ price: priceId, quantity: addon ? units : 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(existingCustomerId ? { customer: existingCustomerId } : buyerEmail ? { customer_email: buyerEmail } : {}),
      ...(oneTime && !existingCustomerId ? { customer_creation: "always" as const } : {}),
      ...(identity?.userId ? { client_reference_id: identity.userId } : {}),
      // Copied onto the subscription too: its webhooks carry no checkout session.
      metadata,
      ...(oneTime ? {} : { subscription_data: { metadata } }),
      integration_identifier: `icancall_checkout_${addon ? "addon" : "plan"}_wpkmzqtd`,
      // Shown above the pay button so buyers see the refund terms before paying.
      ...(addon ? {} : { custom_text: { submit: { message: isPetsPlan(plan) ? PETS_REFUND_POLICY_NOTE : REFUND_POLICY_NOTE } } }),
    });

    if (!session.url) {
      console.error("Stripe checkout session has no url:", session.id);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
    }
    return NextResponse.json({ checkoutUrl: session.url, checkoutId: session.id });
  } catch (err) {
    console.error("Stripe checkout exception:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}
