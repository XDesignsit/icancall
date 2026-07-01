import { NextRequest, NextResponse } from "next/server";

const CREEM_API = process.env.CREEM_API_KEY?.startsWith("creem_test_")
  ? "https://test-api.creem.io/v1"
  : "https://api.creem.io/v1";

const PLAN_PRODUCT_IDS: Record<string, Record<string, string>> = {
  essential: {
    monthly: process.env.CREEM_PRODUCT_ID_ESSENTIAL_MONTHLY!,
    yearly:  process.env.CREEM_PRODUCT_ID_ESSENTIAL_YEARLY!,
  },
  pro: {
    monthly: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY!,
    yearly:  process.env.CREEM_PRODUCT_ID_PRO_YEARLY!,
  },
};

const ADDON_PRODUCT_IDS: Record<string, string> = {
  phone_number:  process.env.CREEM_PRODUCT_ID_ADDON_PHONE_NUMBER!,
  voice_minutes: process.env.CREEM_PRODUCT_ID_ADDON_VOICE_MINUTES!,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, email, addon, quantity } = await req.json();

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    let productId: string;
    let successUrl: string;

    if (addon) {
      productId = ADDON_PRODUCT_IDS[addon];
      if (!productId) {
        return NextResponse.json({ error: "Invalid add-on type" }, { status: 400 });
      }
      successUrl = `${appUrl}/dashboard/addon-success?addon=${addon}&qty=${quantity || 1}`;
    } else {
      productId = PLAN_PRODUCT_IDS[plan]?.[billing];
      if (!productId) {
        return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
      }
      successUrl = `${appUrl}/signup/creem-checkout?status=success`;
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
