import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/mail";
import { releaseProvisionedNumber, type TelephonyRecord } from "@/lib/numbers";

// What happens when a subscription really ends (Creem: canceled / expired).
//
// The customer's numbers are what the product is — a family has memorised
// them — and a number given back to the carrier cannot be recovered. So an
// ended subscription does not lose them straight away: calls keep routing and
// the numbers are held for GRACE_DAYS, during which resubscribing keeps
// everything. After that a daily job (api/cron/release-ended-numbers) releases
// them so they stop billing.
//
// State lives on profiles.settings and is written server-side only:
//   subscriptionEndedAt  when the subscription ended
//   numbersReleaseAt     when the numbers will be released
//   numbersReleasedAt    set once they have been
//   releaseReminderSentAt

export const GRACE_DAYS = 30;
export const REMINDER_DAYS_BEFORE = 7;

export type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const ENDED_STATUSES = ["canceled", "expired"];
export const isEndedStatus = (status: unknown): boolean => typeof status === "string" && ENDED_STATUSES.includes(status);

/** Settings to merge when a subscription ends. Keeps the original dates if it had already ended. */
export function endedPatch(settings: Settings, status: string, now = new Date()): Settings {
  const endedAt = settings.subscriptionEndedAt || now.toISOString();
  return {
    subscriptionStatus: status,
    subscriptionEndedAt: endedAt,
    numbersReleaseAt: settings.numbersReleaseAt || new Date(new Date(endedAt).getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/** Settings to merge when a subscription is (again) active: the clock stops and nothing is released. */
export const REACTIVATED_PATCH: Settings = {
  subscriptionStatus: "active",
  subscriptionEndsAt: null,
  subscriptionEndedAt: null,
  numbersReleaseAt: null,
  numbersReleasedAt: null,
  releaseReminderSentAt: null,
};

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "https://app.icancall.co").replace(/\/$/, "");

function emailShell(heading: string, paragraphs: string[]): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #f1f5f9;border-radius:12px;">
      <div style="margin-bottom:20px;"><span style="font-size:1.1rem;font-weight:700;color:#1e3a8a;">iCanCall</span></div>
      <h2 style="color:#0f172a;font-size:1.3rem;font-weight:700;margin:0 0 12px;">${heading}</h2>
      ${paragraphs.map((p) => `<p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 16px;">${p}</p>`).join("")}
      <p style="margin:24px 0 0;"><a href="${appUrl()}/dashboard?view=account" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">Resubscribe</a></p>
    </div>`;
}

/** Tells the customer their subscription has ended and until when the numbers are safe. Never throws. */
export async function sendSubscriptionEndedEmail(to: string, releaseAtIso: string): Promise<void> {
  const date = longDate(releaseAtIso);
  try {
    await sendEmail({
      to,
      subject: "Your iCanCall subscription has ended",
      text: `Your iCanCall subscription has ended.\n\nYour phone numbers will keep working until ${date}. If you resubscribe before then, you keep the same numbers and everything stays as it is.\n\nAfter ${date} your numbers are released back to the carrier and cannot be recovered.\n\nResubscribe: ${appUrl()}/dashboard?view=account`,
      html: emailShell("Your subscription has ended", [
        `Your phone numbers will keep working until <strong>${date}</strong>. If you resubscribe before then, you keep the same numbers and everything stays as it is.`,
        `After ${date} your numbers are released back to the carrier and <strong>cannot be recovered</strong>.`,
      ]),
    });
  } catch (err) {
    console.error(`Failed to send subscription-ended email to ${to}:`, err);
  }
}

/** Last call, REMINDER_DAYS_BEFORE days ahead of the release. Never throws. */
export async function sendReleaseReminderEmail(to: string, releaseAtIso: string): Promise<void> {
  const date = longDate(releaseAtIso);
  try {
    await sendEmail({
      to,
      subject: `Your iCanCall numbers will be released on ${date}`,
      text: `Your iCanCall subscription has ended, and your phone numbers will be released on ${date}. After that they cannot be recovered.\n\nTo keep them, resubscribe before then: ${appUrl()}/dashboard?view=account`,
      html: emailShell(`Your numbers will be released on ${date}`, [
        `Your subscription has ended, and your phone numbers will be released back to the carrier on <strong>${date}</strong>. After that they <strong>cannot be recovered</strong>.`,
        `To keep them, resubscribe before then.`,
      ]),
    });
  } catch (err) {
    console.error(`Failed to send release reminder email to ${to}:`, err);
  }
}

/**
 * Gives an ended account's numbers back to the carrier and removes its lines,
 * the same way removing a line from the dashboard does. The lines (with their
 * contacts and routing) are archived on the profile first, so support can see
 * what the customer had. Returns the numbers released.
 */
export async function releaseAccountNumbers(profile: { id: string; settings: Settings }): Promise<string[]> {
  const { data: lines, error } = await supabase.from("phone_lines").select("*").eq("user_id", profile.id);
  if (error) throw error;

  const released: string[] = [];
  for (const line of lines || []) {
    await releaseProvisionedNumber(line.number, line.settings?.telephony as TelephonyRecord | undefined);
    released.push(line.number);
  }

  const now = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({
      settings: {
        ...profile.settings,
        numbersReleasedAt: now,
        archivedLines: [
          ...(Array.isArray(profile.settings.archivedLines) ? profile.settings.archivedLines : []),
          ...(lines || []).map((l: Record<string, unknown>) => ({ ...l, releasedAt: now })),
        ],
      },
    })
    .eq("id", profile.id);

  if ((lines || []).length > 0) {
    await supabase.from("phone_lines").delete().eq("user_id", profile.id);
  }
  return released;
}
