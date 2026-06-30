import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const sig = req.headers.get("creem-signature") ?? req.headers.get("x-creem-signature") ?? "";
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.completed") {
    const checkout = event.data as {
      id: string;
      customer?: { id?: string; email?: string };
      subscription?: { id?: string };
    };

    const email = checkout.customer?.email;
    const customerId = checkout.customer?.id;
    const subscriptionId = checkout.subscription?.id;

    console.log(`Creem checkout.completed — email: ${email}, customer: ${customerId}, subscription: ${subscriptionId}`);

    if (email && customerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, settings")
        .eq("email", email)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            settings: {
              ...profile.settings,
              creem_customer_id: customerId,
              creem_subscription_id: subscriptionId ?? profile.settings?.creem_subscription_id,
            },
          })
          .eq("id", profile.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
