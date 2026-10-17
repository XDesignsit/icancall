import type { Account } from '@/lib/db';
import { dashboardLink } from '@/lib/linkKinds';
import { sendMinutesAlertEmail } from '@/lib/mail';
import { minuteAlertThresholds } from '@/lib/minutesCycle';
import { fillCopy, minuteAlertCopy, type MinuteAlertLevel } from '@/lib/minuteAlertTranslations';
import { isMock, supabase } from '@/lib/supabase';

/**
 * Tells the account owner when the cycle's voice minutes run low (85% used)
 * and when they run out: an email to the account's notification address and,
 * when the owner verified a number and opted in to texts, a text. Each alert
 * goes out at most once per minutes cycle (see claimMinuteAlert).
 *
 * Called after a call's minutes are charged (chargeCallMinutes) with the
 * account as it stands after the charge, and when the voice webhook turns a
 * caller away for lack of minutes (a pool that shrank, say on a downgrade,
 * can be used up without a charge). Never throws: a failed alert costs a log
 * line, never the call.
 */
export async function alertIfMinutesLow(account: Account): Promise<void> {
  try {
    const pool = account.allotted_minutes;
    const used = account.used_minutes;
    if (!(pool > 0)) return;
    const { low, out } = minuteAlertThresholds(pool);
    const level: MinuteAlertLevel | null = used >= out ? 'out' : used >= low ? 'low' : null;
    if (!level) return;
    if (!(await claimMinuteAlert(account.id, level, level === 'out' ? out : low))) return;

    const minutes = { used: Math.min(used, pool), pool, left: Math.max(0, pool - used) };
    const copy = minuteAlertCopy(account.language);
    console.log(`Minutes ${level} alert for ${account.id}: ${used} of ${pool} min used.`);

    const to = account.notifyEmail || account.email;
    if (to) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.icancall.co').replace(/\/$/, '');
      await sendMinutesAlertEmail(to, level, copy, minutes, `${appUrl}/dashboard?view=account&tab=billing`);
    }

    if (account.smsPhone) {
      try {
        const { sendSms } = await import('@/lib/twilio');
        await sendSms(account.smsPhone, fillCopy(copy[level].sms, { ...minutes, link: dashboardLink('minutes') }));
      } catch (err) {
        console.error(`Minutes ${level} alert text for ${account.id} failed:`, err);
      }
    }
  } catch (err) {
    console.error(`Minutes alert for ${account.id} failed:`, err);
  }
}

/**
 * Marks the alert sent for this cycle, and says whether this caller is the one
 * that marked it (and so sends it). Production does it in one conditional
 * update (migration 20261017180000_minute_alerts), so concurrent calls cannot
 * both send it and settings are never read-modify-written from here.
 */
async function claimMinuteAlert(userId: string, level: MinuteAlertLevel, minUsed: number): Promise<boolean> {
  const marker = level === 'out' ? 'outMinAlertedAt' : 'lowMinAlertedAt';
  if (isMock) return claimMinuteAlertLocally(userId, marker, minUsed);
  const { data, error } = await supabase.rpc('claim_minute_alert', { p_user_id: userId, p_marker: marker, p_min_used: minUsed });
  if (error) throw error;
  return data === true;
}

/** The local mock database has no functions: the same check, then the write. */
async function claimMinuteAlertLocally(userId: string, marker: string, minUsed: number): Promise<boolean> {
  const { data: profile } = await supabase.from('profiles').select('settings').eq('id', userId).maybeSingle();
  const settings = profile?.settings || {};
  const addons = settings.addons || {};
  if (addons[marker] || Number(addons.usedMin || 0) < minUsed) return false;
  const now = new Date().toISOString();
  const marked = { ...addons, [marker]: now, ...(marker === 'outMinAlertedAt' ? { lowMinAlertedAt: addons.lowMinAlertedAt || now } : {}) };
  await supabase.from('profiles').update({ settings: { ...settings, addons: marked } }).eq('id', userId);
  return true;
}
