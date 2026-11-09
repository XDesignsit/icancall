import { isMock, supabase } from './supabase';
import { billedMinutes, minutePool } from './minutesCycle';
import { toE164 } from './phone';
import { scheduleTimeZone } from './coverageSchedule';
import { customVoiceOf, effectiveVoiceId } from './voices';

export interface LineContact {
  name?: string;
  phone?: string;
  voicePath?: string;
  available?: boolean;
  [key: string]: unknown;
}

export interface LineSettings {
  voiceId?: string;
  greeting?: string;
  greetingAudioPath?: string;
  /** Bilingual Support (lib/callPrompts): off unless true. */
  bilingual?: boolean;
  /** The second language's code; older lines hold its name ("Spanish"). */
  language2?: string;
  /** Custom greeting for callers who switch to the second language. */
  greeting2?: string;
  /** See lib/cascadeAnnounce. */
  directConnect?: boolean;
  [key: string]: unknown;
}

/** One stretch of a line's around-the-clock coverage; `name` is the contact's name. */
export interface CoverageSlot {
  name?: string;
  description?: string;
  startHour?: number;
  endHour?: number;
  [key: string]: unknown;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  notifyEmail: string;
  /**
   * Where call alerts are texted: the number the owner verified and opted in
   * with (signup, or Account → Contact info). Empty without that consent.
   */
  smsPhone?: string;
  plan: string;
  /** The plan has ended (lib/subscriptionEnd) and the number is in its grace period. */
  subscriptionEnded?: boolean;
  /** The owner's language by name ("English", "Spanish"; Account → Contact info), for owner alerts. */
  language: string;
  used_minutes: number;
  allotted_minutes: number;
  /** IANA zone the line's coverage schedule runs on (see lib/coverageSchedule). */
  timeZone: string;
  line?: {
    id: string;
    name: string;
    type: string;
    contacts: LineContact[];
    mode: 'menu' | 'cascade' | 'simultaneous' | 'schedule';
    schedule: CoverageSlot[];
    settings: LineSettings;
    /** How the number was bought (lib/numbers), when it was. */
    telephony?: { provider?: string; sid?: string; statusCallback?: string };
  };
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const accountCache = new Map<string, CacheEntry<Account | undefined>>();
const CACHE_TTL_MS = 60000;
const CACHE_MAX_SIZE = 500;

function getCachedAccount(phoneNumber: string): Account | undefined | null {
  const entry = accountCache.get(phoneNumber);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  if (entry) {
    accountCache.delete(phoneNumber);
  }
  return null; // Cache miss
}

function setCachedAccount(phoneNumber: string, account: Account | undefined) {
  if (accountCache.size >= CACHE_MAX_SIZE) {
    // Evict the oldest entry (Map preserves insertion order)
    const oldestKey = accountCache.keys().next().value;
    if (oldestKey !== undefined) accountCache.delete(oldestKey);
  }
  accountCache.set(phoneNumber, {
    data: account,
    expiry: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateCachedAccount(phoneNumber: string) {
  accountCache.delete(toE164(phoneNumber));
}

// Find an account (caregiver profile) and line details by the dialed Twilio phone number
export async function findAccountByTwilioNumber(phoneNumber: string): Promise<Account | undefined> {
  // Gateways always dial in E.164; rows may predate normalisation, so match on
  // the canonical form rather than a bare whitespace strip.
  const normalizedSearch = toE164(phoneNumber);

  const cached = getCachedAccount(normalizedSearch);
  if (cached !== null) {
    return cached;
  }

  try {
    // 1. Find the phone line row
    const { data: line, error: lineError } = await supabase
      .from('phone_lines')
      .select('*')
      .eq('number', normalizedSearch)
      .maybeSingle();

    if (lineError || !line) {
      console.warn('Failed to query phone line from Supabase or line not found:', lineError || 'No match');
      setCachedAccount(normalizedSearch, undefined);
      return undefined;
    }

    // 2. Find the caregiver profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', line.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn('Failed to query profile from Supabase or profile not found:', profileError || 'No match');
      setCachedAccount(normalizedSearch, undefined);
      return undefined;
    }

    const settings = profile.settings || {};
    const addons = settings.addons || {};
    const plan = settings.plan || 'pro';
    // Both in talk minutes, as the dashboard shows them (lib/minutesCycle).
    const allotted = minutePool(plan, addons);
    const used = Number(addons.usedMin || 0);

    const lineSettings = line.settings || {};
    const extraSettings: LineSettings = lineSettings.extraSettings || {};

    const account: Account = {
      id: profile.id,
      name: profile.name || 'Caregiver',
      email: profile.email,
      notifyEmail: settings.notifyEmail || profile.email,
      smsPhone: settings.smsConsent === true ? toE164(settings.smsPhone) : '',
      plan,
      subscriptionEnded: settings.subscriptionStatus === 'canceled' || settings.subscriptionStatus === 'expired',
      language: settings.language || 'English',
      used_minutes: used,
      allotted_minutes: allotted,
      timeZone: scheduleTimeZone(settings.timezone, normalizedSearch),
      line: {
        id: line.id,
        name: line.name || '',
        type: line.type || '',
        contacts: line.contacts || [],
        mode: lineSettings.mode || 'menu',
        schedule: Array.isArray(lineSettings.schedule) ? lineSettings.schedule : [],
        // Only a stock voice or the owner's own clone (lib/voices).
        settings: { ...extraSettings, voiceId: effectiveVoiceId(extraSettings.voiceId, customVoiceOf(settings), plan) },
        telephony: lineSettings.telephony,
      }
    };

    setCachedAccount(normalizedSearch, account);
    return account;
  } catch (err) {
    console.error('findAccountByTwilioNumber error:', err);
    return undefined;
  }
}

/**
 * Charges a call's talk time to its account's minute pool, once per call: a
 * call that was already charged (a retried webhook, or the second of the two
 * webhooks that report on a menu-mode call) charges nothing. Called when the
 * call ends, from the number's call-status webhook and, for the <Dial action>
 * paths (Telnyx lines, local dev, menu mode), from the voice webhook. Never
 * throws: a failed charge costs a log line, never the call.
 *
 * Production runs it as one database function (migration
 * 20261017120000_call_minute_metering) so the claim and the add are atomic and
 * concurrent calls cannot overwrite each other's usage.
 */
export async function chargeCallMinutes(callSid: string, lineNumber: string, talkSeconds: number | null): Promise<void> {
  const minutes = billedMinutes(talkSeconds);
  if (!callSid || minutes <= 0) return;
  try {
    let used: unknown;
    if (isMock) {
      used = await chargeCallMinutesLocally(callSid, minutes);
    } else {
      const { data, error } = await supabase.rpc('charge_call_minutes', { p_call_sid: callSid, p_minutes: minutes });
      if (error) throw error;
      used = data;
    }
    if (used !== null && used !== undefined) {
      invalidateCachedAccount(lineNumber);
      console.log(`Charged ${minutes} min for ${callSid} on ${toE164(lineNumber)}; ${used} min used this cycle.`);
      // The owner hears about it once the minutes run low or out.
      const account = await findAccountByTwilioNumber(lineNumber);
      if (account) {
        const { alertIfMinutesLow } = await import('./minuteAlerts');
        await alertIfMinutesLow(account);
      }
    }
  } catch (err) {
    console.error(`Could not charge minutes for ${callSid}:`, err);
  }
}

/** The local mock database has no functions: the same claim, then the add. */
async function chargeCallMinutesLocally(callSid: string, minutes: number): Promise<number | null> {
  const { data: claimed } = await supabase
    .from('calls')
    .update({ metered_minutes: minutes })
    .eq('call_sid', callSid)
    .is('metered_minutes', null)
    .select('line_id');
  const lineId = Array.isArray(claimed) ? claimed[0]?.line_id : null;
  if (!lineId) return null;
  const { data: line } = await supabase.from('phone_lines').select('user_id').eq('id', lineId).maybeSingle();
  if (!line) return null;
  const { data: profile } = await supabase.from('profiles').select('settings').eq('id', line.user_id).maybeSingle();
  const settings = profile?.settings || {};
  const used = Number(settings.addons?.usedMin || 0) + minutes;
  await supabase
    .from('profiles')
    .update({ settings: { ...settings, addons: { ...(settings.addons || {}), usedMin: used } } })
    .eq('id', line.user_id);
  return used;
}

// Check available minutes
export function getAvailableMinutes(account: Account): number {
  return account.allotted_minutes - account.used_minutes;
}
