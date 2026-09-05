import { supabase } from './supabase';
import { planConfig } from './planConfig';
import { toE164 } from './phone';

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
  [key: string]: unknown;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  notifyEmail: string;
  smsPhone?: string;
  plan: string;
  used_minutes: number;
  allotted_minutes: number;
  line?: {
    id: string;
    name: string;
    type: string;
    contacts: LineContact[];
    mode: 'menu' | 'cascade' | 'schedule';
    settings: LineSettings;
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
    // Telephony allotment is 2x the marketed minutes (both call legs count).
    const allotted = planConfig(plan).voiceMinutes * 2 + (Number(addons.minuteBlocks || 0) * 60);
    const used = Number(addons.usedMin || 0);

    const lineSettings = line.settings || {};

    const account: Account = {
      id: profile.id,
      name: profile.name || 'Caregiver',
      email: profile.email,
      notifyEmail: settings.notifyEmail || profile.email,
      smsPhone: settings.smsPhone || settings.phone || profile.phone || '',
      plan,
      used_minutes: used,
      allotted_minutes: allotted,
      line: {
        id: line.id,
        name: line.name || '',
        type: line.type || '',
        contacts: line.contacts || [],
        mode: lineSettings.mode || 'menu',
        settings: lineSettings.extraSettings || {},
      }
    };

    setCachedAccount(normalizedSearch, account);
    return account;
  } catch (err) {
    console.error('findAccountByTwilioNumber error:', err);
    return undefined;
  }
}

// Deduct minutes consumed by a call
export async function deductMinutes(twilioPhoneNumber: string, minutes: number): Promise<Account | null> {
  const normalizedSearch = toE164(twilioPhoneNumber);
  // Invalidate any existing cache entry before performing database updates to prevent stale reads
  invalidateCachedAccount(normalizedSearch);

  try {
    const account = await findAccountByTwilioNumber(twilioPhoneNumber);
    if (!account) return null;

    const newUsed = account.used_minutes + minutes;

    // Fetch current profile settings to update them safely
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', account.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch profile settings before updating:', fetchError);
      return null;
    }

    const settings = profile?.settings || {};
    if (!settings.addons) settings.addons = {};
    settings.addons.usedMin = newUsed;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ settings })
      .eq('id', account.id);

    if (updateError) {
      console.error('Failed to update used minutes in profiles:', updateError);
      return null;
    }

    const updatedAccount: Account = {
      ...account,
      used_minutes: newUsed,
    };

    // Cache the updated account state immediately
    setCachedAccount(normalizedSearch, updatedAccount);
    return updatedAccount;
  } catch (err) {
    console.error('deductMinutes error:', err);
    return null;
  }
}

// Check available minutes
export function getAvailableMinutes(account: Account): number {
  return account.allotted_minutes - account.used_minutes;
}
