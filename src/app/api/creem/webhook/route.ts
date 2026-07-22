import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { planConfig } from "@/lib/planConfig";

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

  if (event.type === "subscription.renewed") {
    const sub = event.data as {
      id?: string;
      customer?: { id?: string; email?: string };
    };

    const email = sub.customer?.email;
    console.log(`Creem subscription.renewed — email: ${email}`);

    if (email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, settings")
        .eq("email", email)
        .single();

      if (profile) {
        const addons = profile.settings?.addons || {};
        const planBaseMinutes = planConfig(profile.settings?.plan || "essential").voiceMinutes;

        const addonMinutes = (addons.minuteBlocks || 0) * 30;
        const totalPool = planBaseMinutes + addonMinutes + (addons.rolloverMin || 0);
        const usedMin = Math.min(addons.usedMin || 0, totalPool);

        // Only unused add-on minutes roll over — base plan minutes do not
        const unusedAddonMin = Math.max(0, addonMinutes - Math.max(0, usedMin - planBaseMinutes));
        const newRolloverMin = (addons.rolloverMin || 0) + unusedAddonMin;

        await supabase
          .from("profiles")
          .update({
            settings: {
              ...profile.settings,
              addons: {
                ...addons,
                usedMin: 0,
                rolloverMin: newRolloverMin,
              },
            },
          })
          .eq("id", profile.id);

        console.log(`Billing reset for ${email}: rollover=${newRolloverMin} min (unused addon: ${unusedAddonMin})`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
