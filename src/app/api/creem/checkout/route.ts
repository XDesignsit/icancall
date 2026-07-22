import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const CREEM_API = process.env.CREEM_API_KEY?.startsWith("creem_test_")
  ? "https://test-api.creem.io/v1"
  : "https://api.creem.io/v1";

const DEMO_EMAILS = ["support@icancall.co", "admin@icancall.co"];

// Demo accounts must never reach a real payment gateway, and local/preview
// environments have no Creem credentials at all — both get a simulated
// checkout that lands directly on the success URL so the normal post-payment
// flow (success flag → apply add-ons → sync to DB) still runs end to end.
async function isSimulatedCheckout(productId: string): Promise<boolean> {
  if (!process.env.CREEM_API_KEY || !productId) return true;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return false;
    const payload = await verifySession(sessionToken);
    return !!payload && DEMO_EMAILS.includes(payload.email);
  } catch {
    return false;
  }
}

const PLAN_PRODUCT_IDS: Record<string, Record<string, string>> = {
  essential: {
    monthly: process.env.CREEM_PRODUCT_ID_ESSENTIAL_MONTHLY!,
    yearly:  process.env.CREEM_PRODUCT_ID_ESSENTIAL_YEARLY!,
  },
  pro: {
    monthly: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY!,
    yearly:  process.env.CREEM_PRODUCT_ID_PRO_YEARLY!,
  },
  careteam: {
    monthly: process.env.CREEM_PRODUCT_ID_CARETEAM_MONTHLY!,
    yearly:  process.env.CREEM_PRODUCT_ID_CARETEAM_YEARLY!,
  },
};

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

    let productId: string;
    let successUrl: string;

    if (addon) {
      if (!(addon in ADDON_PRODUCT_IDS)) {
        return NextResponse.json({ error: "Invalid add-on type" }, { status: 400 });
      }
      productId = ADDON_PRODUCT_IDS[addon];
      successUrl = `${appUrl}/dashboard/addon-success?addon=${addon}&qty=${quantity || 1}`;
    } else {
      if (!PLAN_PRODUCT_IDS[plan] || !(billing in PLAN_PRODUCT_IDS[plan])) {
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

    if (await isSimulatedCheckout(productId)) {
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

    const res = await fetch(`${CREEM_API}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY!,
      },
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
