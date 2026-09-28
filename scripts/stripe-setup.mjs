// Creates (or finds) everything iCanCall bills for in the Stripe account the
// key belongs to, then prints the env vars the app reads. Safe to re-run:
// prices are looked up by lookup_key, so nothing is created twice.
//
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs [--webhook-url https://app.icancall.co/api/billing/webhook]
//
// Prices mirror src/lib/pricing.ts (PLAN_PRICING, ADDON_PRICING). If those
// change, change them here too — and create new prices rather than editing
// old ones, because Stripe prices are immutable.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY (a sandbox key for testing, the live key for production).");
  process.exit(1);
}
const stripe = new Stripe(key);
const webhookUrl = process.argv.includes("--webhook-url") ? process.argv[process.argv.indexOf("--webhook-url") + 1] : null;

const PLANS = [
  { id: "essential", name: "iCanCall Essential", monthly: 1499, yearly: 14900 },
  { id: "pro", name: "iCanCall Pro", monthly: 2499, yearly: 24900 },
  { id: "careteam", name: "iCanCall Care Team", monthly: 4999, yearly: 49900 },
];
const ADDONS = [
  { id: "phone_number", env: "PHONE_NUMBER", name: "iCanCall extra phone number", amount: 699, recurring: { interval: "month" } },
  { id: "voice_minutes", env: "VOICE_MINUTES", name: "iCanCall 30 extra voice minutes", amount: 499, recurring: null },
];

const products = new Map();
async function productFor(name) {
  if (products.has(name)) return products.get(name);
  const found = await stripe.products.search({ query: `name:"${name}" AND active:"true"`, limit: 1 });
  const product = found.data[0] ?? (await stripe.products.create({ name }));
  products.set(name, product);
  return product;
}

async function priceFor(lookupKey, name, amount, recurring) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data[0]) {
    if (existing.data[0].unit_amount !== amount) {
      console.warn(`! ${lookupKey} already exists at ${existing.data[0].unit_amount}c, wanted ${amount}c — left alone. Create a new price and move the lookup key to change it.`);
    }
    return existing.data[0];
  }
  const product = await productFor(name);
  return stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: amount,
    lookup_key: lookupKey,
    ...(recurring ? { recurring } : {}),
  });
}

const env = [];
for (const plan of PLANS) {
  const monthly = await priceFor(`icancall_${plan.id}_monthly`, plan.name, plan.monthly, { interval: "month" });
  const yearly = await priceFor(`icancall_${plan.id}_yearly`, plan.name, plan.yearly, { interval: "year" });
  env.push(`STRIPE_PRICE_ID_${plan.id.toUpperCase()}_MONTHLY=${monthly.id}`, `STRIPE_PRICE_ID_${plan.id.toUpperCase()}_YEARLY=${yearly.id}`);
}
for (const addon of ADDONS) {
  const price = await priceFor(`icancall_addon_${addon.id}`, addon.name, addon.amount, addon.recurring);
  env.push(`STRIPE_PRICE_ID_ADDON_${addon.env}=${price.id}`);
}

// Customer portal: card updates, invoices and cancel-at-period-end. Plan
// switching stays in the dashboard, where the app enforces how many phone
// numbers each plan covers.
const portalFeatures = {
  customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "phone"] },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: true, mode: "at_period_end", proration_behavior: "none" },
};
const portalProfile = { headline: "Manage your iCanCall billing" };
const portals = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
if (portals.data[0]) {
  await stripe.billingPortal.configurations.update(portals.data[0].id, { features: portalFeatures, business_profile: portalProfile });
} else {
  await stripe.billingPortal.configurations.create({ features: portalFeatures, business_profile: portalProfile });
}
console.log("Customer portal configured.");

if (webhookUrl) {
  const events = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
  ];
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === webhookUrl);
  if (existing) {
    await stripe.webhookEndpoints.update(existing.id, { enabled_events: events });
    console.log(`Webhook ${webhookUrl} already exists (${existing.id}); events updated. Its signing secret is only shown at creation — reveal it in the Dashboard.`);
  } else {
    const created = await stripe.webhookEndpoints.create({ url: webhookUrl, enabled_events: events });
    env.push(`STRIPE_WEBHOOK_SECRET=${created.secret}`);
  }
}

console.log("\n# Add to Vercel (right scope) / .env.local:");
console.log(env.join("\n"));
