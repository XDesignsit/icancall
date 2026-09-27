import { isTwilioConfigured, providerForNumber, purchaseNumber as twilioPurchase, releaseNumber as twilioRelease, type TelephonyProvider } from "./twilio";
import { isTelnyxConfigured, purchaseNumber as telnyxPurchase, releaseNumber as telnyxRelease } from "./telnyx";
import { isDemoEmail } from "./demoEmails";
import twilioClient from "./twilio";
import { supabase } from "./supabase";
import { invalidateCachedAccount } from "./db";

// Attaching a number to an account has to buy it from the carrier, or the
// line is a row in our table pointing at inventory anyone else can take and
// no call ever reaches the voice webhook. This module owns that step for both
// carriers, and the bookkeeping stored on the line so it can be released.

/** Stored on phone_lines.settings.telephony. */
export interface TelephonyRecord {
  provider: TelephonyProvider;
  /** Carrier-side id (Twilio PN SID / Telnyx order id) when we bought it. */
  sid?: string;
  status: "purchased" | "skipped";
  reason?: string;
  purchasedAt?: string;
  /** Where the number reports each call's end (Twilio), once it has been set. */
  statusCallback?: string;
}

export type ProvisionOutcome =
  | { ok: true; record: TelephonyRecord }
  | { ok: false; error: string };

/** Twilio's magic test numbers never get purchased. */
function isMagicTestNumber(phoneNumber: string): boolean {
  return /^\+1500555\d{4}$/.test(phoneNumber);
}

/**
 * Whether this environment may spend money on numbers. Local development has
 * no carrier credentials, and preview deploys share production's live Twilio
 * account, so they stay on unpurchased numbers unless PURCHASE_NUMBERS=1 is
 * set on purpose. Production always purchases.
 */
export function purchasesEnabled(): { enabled: boolean; reason?: string } {
  if (process.env.VERCEL_ENV === "preview" && process.env.PURCHASE_NUMBERS !== "1") {
    return { enabled: false, reason: "preview_env" };
  }
  return { enabled: true };
}

function voiceWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/twilio/voice`;
}

/** Twilio reports the end of every inbound call here; it closes the call log row. */
export function callStatusWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/twilio/call-status`;
}

/**
 * Numbers bought before the call log existed only have their voice webhook.
 * The voice webhook calls this for each call: the first time, it points the
 * number's call-status webhook at the call log and notes that on the line, so
 * every later call skips straight past. Never throws -- a call must not fail
 * over bookkeeping -- and the call already under way is reported the old way.
 */
export async function ensureCallStatusWebhook(
  line: { id: string; telephony?: { provider?: string; sid?: string; statusCallback?: string } },
  lineNumber: string
): Promise<void> {
  const url = callStatusWebhookUrl();
  const telephony = line.telephony;
  if (!twilioClient || !telephony?.sid || telephony.provider !== "twilio" || telephony.statusCallback === url) return;
  try {
    await twilioClient.incomingPhoneNumbers(telephony.sid).update({ statusCallback: url, statusCallbackMethod: "POST" });
    const { data: row } = await supabase.from("phone_lines").select("settings").eq("id", line.id).maybeSingle();
    const settings = (row?.settings || {}) as Record<string, unknown>;
    const stored = (settings.telephony || {}) as Record<string, unknown>;
    await supabase
      .from("phone_lines")
      .update({ settings: { ...settings, telephony: { ...stored, statusCallback: url } } })
      .eq("id", line.id);
    invalidateCachedAccount(lineNumber);
    console.log(`Pointed ${lineNumber}'s call-status webhook at ${url}`);
  } catch (err) {
    console.error(`Could not set ${lineNumber}'s call-status webhook:`, err);
  }
}

/**
 * Buy a number for an account. Never throws: a purchase that cannot happen
 * for a benign reason (demo account, local dev, preview) comes back as a
 * "skipped" record so the line is still created, while a real carrier failure
 * comes back as ok:false so the caller can refuse the line.
 */
export async function provisionNumber(phoneNumber: string, ownerEmail: string): Promise<ProvisionOutcome> {
  const provider = providerForNumber(phoneNumber);
  const skipped = (reason: string): ProvisionOutcome => ({ ok: true, record: { provider, status: "skipped", reason } });

  if (isDemoEmail(ownerEmail)) return skipped("demo_account");
  if (isMagicTestNumber(phoneNumber)) return skipped("magic_test_number");
  const gate = purchasesEnabled();
  if (!gate.enabled) return skipped(gate.reason || "disabled");
  if (provider === "twilio" && !isTwilioConfigured()) return skipped("twilio_unconfigured");
  if (provider === "telnyx" && !isTelnyxConfigured()) return skipped("telnyx_unconfigured");

  try {
    const { sid } = provider === "telnyx"
      ? await telnyxPurchase(phoneNumber)
      : await twilioPurchase(phoneNumber, { voiceUrl: voiceWebhookUrl(), statusCallback: callStatusWebhookUrl(), friendlyName: `iCanCall ${ownerEmail}` });
    console.log(`Purchased ${phoneNumber} from ${provider} for ${ownerEmail} (${sid})`);
    return {
      ok: true,
      record: {
        provider,
        sid,
        status: "purchased",
        purchasedAt: new Date().toISOString(),
        ...(provider === "twilio" ? { statusCallback: callStatusWebhookUrl() } : {}),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to purchase ${phoneNumber} from ${provider} for ${ownerEmail}:`, message);
    return { ok: false, error: message };
  }
}

/**
 * Give a number back to the carrier when its line is removed, so it stops
 * billing. Only numbers we recorded as purchased are released; anything else
 * (seeded rows, skipped purchases) was never ours to release. Failures are
 * logged, not thrown: the line removal must still go through.
 */
export async function releaseProvisionedNumber(phoneNumber: string, record: TelephonyRecord | undefined): Promise<void> {
  if (!record || record.status !== "purchased") return;
  try {
    if (record.provider === "telnyx") {
      await telnyxRelease(phoneNumber);
    } else {
      await twilioRelease(phoneNumber, record.sid);
    }
    console.log(`Released ${phoneNumber} back to ${record.provider}`);
  } catch (err) {
    console.error(`Failed to release ${phoneNumber} from ${record.provider}; it is still billing:`, err);
  }
}
