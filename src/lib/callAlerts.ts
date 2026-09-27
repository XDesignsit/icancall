import type { Account } from '@/lib/db';
import type { CallRow } from '@/lib/callRecords';
import { sendVoicemailAlertEmail } from '@/lib/mail';
import { toDisplay, toE164 } from '@/lib/phone';

/**
 * The caregiver's alert for a finished call: one text per call, plus the
 * voicemail email. Called once per call (claimCallAlert decides which webhook
 * sends it) with the call's final state.
 *
 * Channels follow the line's Notifications settings -- SMS Alerts, Email
 * Alerts, and Missed Call Notifications for calls nobody took -- and a text
 * only goes to a number the account owner verified and opted in with
 * (Account.smsPhone is empty otherwise; see findAccountByTwilioNumber).
 */

/** Who called, as the caregiver knows them: a circle member by name, else the number. */
export function callerLabel(account: Account | undefined, from: string | null | undefined): string {
  const e164 = toE164(from);
  if (!e164) return 'Unknown caller';
  const match = account?.line?.contacts?.find((c) => c.phone && toE164(String(c.phone)) === e164);
  return typeof match?.name === 'string' && match.name.trim() ? match.name.trim() : toDisplay(e164);
}

function spoken(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m} min ${rest} sec` : `${m} min`;
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// No links: carriers filter links in texts from the A2P 10DLC number unless
// its campaign declares them, and the missed/voicemail alerts that carried a
// dashboard link never arrived (2026-09-27) while link-free texts did.
export function alertText(account: Account, call: CallRow): string {
  const caller = callerLabel(account, call.from_number);
  const line = account.line?.name?.trim() || 'your iCanCall line';
  if (call.status === 'connected') {
    return `iCanCall: ${caller} called ${line} and was connected to ${call.answered_by || 'a trusted contact'} (${spoken(call.talk_seconds)}).`;
  }
  if (call.status === 'voicemail') {
    const heard = call.transcript ? ` "${clip(call.transcript, 120)}"` : '';
    return `iCanCall: Voicemail from ${caller} on ${line} (${spoken(call.recording_seconds)}).${heard} Listen in your iCanCall call log.`;
  }
  return `iCanCall: Missed call from ${caller} on ${line}. Nobody answered and no message was left.`;
}

export async function sendCallAlert(account: Account, call: CallRow): Promise<void> {
  const settings = account.line?.settings || {};
  const notifSMS = settings.notifSMS ?? true;
  const notifEmail = settings.notifEmail ?? true;
  const notifMissed = settings.notifMissed ?? true;
  const nobodyTookIt = call.status !== 'connected';
  if (nobodyTookIt && !notifMissed) return;

  if (call.status === 'voicemail' && notifEmail) {
    const to = account.notifyEmail || account.email;
    if (to) {
      try {
        await sendVoicemailAlertEmail(
          to,
          callerLabel(account, call.from_number),
          spoken(call.recording_seconds),
          call.recording_url || '',
          call.transcript || undefined
        );
      } catch (err) {
        console.error(`Voicemail alert email for ${call.call_sid} failed:`, err);
      }
    }
  }

  if (notifSMS && account.smsPhone) {
    try {
      const { sendSms } = await import('@/lib/twilio');
      await sendSms(account.smsPhone, alertText(account, call));
    } catch (err) {
      console.error(`Call alert text for ${call.call_sid} failed:`, err);
    }
  }
}
