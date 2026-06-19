import { supabase } from './supabase';

export interface Account {
  id: string;
  name: string;
  email: string;
  notifyEmail: string;
  plan: string;
  used_minutes: number;
  allotted_minutes: number;
  line?: {
    id: string;
    name: string;
    type: string;
    contacts: any[];
    mode: 'menu' | 'cascade' | 'schedule';
    settings: any;
  };
}

// Find an account (caregiver profile) and line details by the dialed Twilio phone number
export async function findAccountByTwilioNumber(phoneNumber: string): Promise<Account | undefined> {
  const normalizedSearch = phoneNumber.replace(/\s+/g, '');

  try {
    // 1. Find the phone line row
    const { data: line, error: lineError } = await supabase
      .from('phone_lines')
      .select('*')
      .eq('number', normalizedSearch)
      .maybeSingle();

    if (lineError || !line) {
      console.warn('Failed to query phone line from Supabase or line not found:', lineError || 'No match');
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
      return undefined;
    }

    const settings = profile.settings || {};
    const addons = settings.addons || {};
    const plan = settings.plan || 'pro';
    const allotted = (plan === 'essential' ? 60 : 120) + (Number(addons.minuteBlocks || 0) * 60);
    const used = Number(addons.usedMin || 0);

    const lineSettings = line.settings || {};

    return {
      id: profile.id,
      name: profile.name || 'Caregiver',
      email: profile.email,
      notifyEmail: settings.notifyEmail || profile.email,
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
  } catch (err) {
    console.error('findAccountByTwilioNumber error:', err);
    return undefined;
  }
}

// Deduct minutes consumed by a call
export async function deductMinutes(twilioPhoneNumber: string, minutes: number): Promise<Account | null> {
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

    return {
      ...account,
      used_minutes: newUsed,
    };
  } catch (err) {
    console.error('deductMinutes error:', err);
    return null;
  }
}

// Check available minutes
export function getAvailableMinutes(account: Account): number {
  return account.allotted_minutes - account.used_minutes;
}
