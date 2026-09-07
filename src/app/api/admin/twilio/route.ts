import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import twilioClient, { isTwilioConfigured, a2pSender } from "@/lib/twilio";

/**
 * Real Twilio account state for the super-admin telephony view.
 *
 * The panel this feeds used to render hardcoded figures -- a $4,210 balance and
 * a $2,000 auto-recharge that were never connected to the account. During live
 * testing that is worse than showing nothing: numbers stop working when the
 * credit runs out, and an invented figure reads healthy the whole way down.
 *
 * Twilio's `balance` is prepaid CREDIT REMAINING, not money owed. It counts
 * down as usage and number renewals are billed against it, so the dashboard
 * presents it as a countdown -- a small number is a warning, not a small bill.
 *
 * Everything here comes from the Twilio API or is reported as unavailable.
 */
async function verifyAdmin() {
  const sessionToken = (await cookies()).get("session")?.value;
  if (!sessionToken) return false;
  const payload = await verifySession(sessionToken);
  return payload?.role === "admin";
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isTwilioConfigured() || !twilioClient) {
    return NextResponse.json({
      configured: false,
      reason: "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set in this environment.",
    });
  }

  const result: Record<string, unknown> = { configured: true, sender: a2pSender() };

  // Each lookup is independent: a permission-scoped key may allow one and not
  // another, and a partial answer beats failing the whole panel.
  await Promise.all([
    (async () => {
      try {
        const balance = await twilioClient.balance.fetch();
        result.balance = Number(balance.balance);
        result.currency = balance.currency;
      } catch (err) {
        result.balanceError = err instanceof Error ? err.message : "credit balance unavailable";
      }
    })(),
    (async () => {
      try {
        const numbers = await twilioClient.incomingPhoneNumbers.list({ limit: 1000 });
        result.numbers = numbers.map((n) => ({
          phoneNumber: n.phoneNumber,
          friendlyName: n.friendlyName,
        }));
        result.numberCount = numbers.length;
      } catch (err) {
        result.numbersError = err instanceof Error ? err.message : "numbers unavailable";
      }
    })(),
    (async () => {
      try {
        const [usage] = await twilioClient.usage.records.thisMonth.list({
          category: "totalprice",
          limit: 1,
        });
        if (usage) {
          result.spendThisMonth = Number(usage.price);
          result.spendCurrency = usage.priceUnit;
        }
      } catch (err) {
        result.spendError = err instanceof Error ? err.message : "usage unavailable";
      }
    })(),
  ]);

  return NextResponse.json(result);
}
