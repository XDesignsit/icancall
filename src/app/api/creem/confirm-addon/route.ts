import { NextRequest, NextResponse } from "next/server";
import { authorizeOwner, loadSettings } from "@/lib/billingOwner";
import { isSimulatedBilling } from "@/lib/creem";
import {
  MAX_ADDON_UNITS,
  creditAddonPurchase,
  creditedAddons,
  isAddonId,
  saveSettingsPatch,
  verifyAddonCheckout,
} from "@/lib/addons";

// Credits an add-on purchase to the signed-in owner's account.
//
//   { checkoutId }  → verifies the checkout with Creem (paid, an add-on
//                     product, started by this account) and credits the units
//                     it bought. Each checkout is credited once.
//
// The dashboard only adds the numbers / minutes when this responds with
// success — the "payment succeeded" message from the checkout window is just
// the cue to call it.
export async function POST(req: NextRequest) {
  try {
    const owner = await authorizeOwner();
    if (owner instanceof NextResponse) return owner;
    const { userId } = owner;

    const body = await req.json().catch(() => ({}));
    const settings = await loadSettings(userId);

    // Demo accounts and unconfigured environments never reach the gateway, so
    // there is no checkout to verify: the simulated purchase is taken as asked.
    if (isSimulatedBilling(owner.email)) {
      const units = Math.floor(Number(body.quantity) || 1);
      if (!isAddonId(body.addon) || units < 1 || units > MAX_ADDON_UNITS) {
        return NextResponse.json({ error: "Invalid add-on type or quantity" }, { status: 400 });
      }
      const addons = creditedAddons(settings.addons as Record<string, unknown> | undefined, body.addon, units);
      await saveSettingsPatch(userId, settings, { addons });
      return NextResponse.json({ success: true, addon: body.addon, units, addons, simulated: true });
    }

    const checkoutId = typeof body.checkoutId === "string" ? body.checkoutId : "";
    if (!checkoutId) return NextResponse.json({ error: "Missing checkout" }, { status: 400 });

    const check = await verifyAddonCheckout(checkoutId, userId);
    if (!check.ok) {
      return check.reason === "lookup_failed"
        ? NextResponse.json({ error: "We couldn't verify your payment. If you were charged, please contact support and we'll add it for you." }, { status: 502 })
        : NextResponse.json({ error: "This checkout has not been paid." }, { status: 402 });
    }

    const addons = await creditAddonPurchase(userId, settings, checkoutId, check.purchase);
    if (!addons) {
      return NextResponse.json({ error: "Payment received, but we couldn't update your account. Please contact support." }, { status: 500 });
    }
    return NextResponse.json({ success: true, addon: check.purchase.addon, units: check.purchase.units, addons });
  } catch (err) {
    console.error("Creem confirm-addon exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
