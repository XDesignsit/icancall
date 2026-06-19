import { supabase } from './supabase';

export interface Account {
  id: string;
  name: string;
  twilioPhoneNumber: string;
  allotted_minutes: number;
  purchased_minutes: number;
  used_minutes: number;
}

// Find an account by their Twilio phone number
export async function findAccountByTwilioNumber(phoneNumber: string): Promise<Account | undefined> {
  const normalizedSearch = phoneNumber.replace(/\s+/g, '');
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('twilio_phone_number', normalizedSearch)
    .maybeSingle();

  if (error) {
    console.error('Failed to query account from Supabase:', error);
    return undefined;
  }

  if (!data) {
    return undefined;
  }

  return {
    id: data.id,
    name: data.name,
    twilioPhoneNumber: data.twilio_phone_number,
    allotted_minutes: data.allotted_minutes,
    purchased_minutes: data.purchased_minutes,
    used_minutes: data.used_minutes,
  };
}

// Deduct minutes consumed by a call
export async function deductMinutes(twilioPhoneNumber: string, minutes: number): Promise<Account | null> {
  const normalizedSearch = twilioPhoneNumber.replace(/\s+/g, '');
  
  // Get current account to calculate new used_minutes
  const account = await findAccountByTwilioNumber(normalizedSearch);
  if (!account) {
    return null;
  }

  const newUsedMinutes = account.used_minutes + minutes;

  const { data, error } = await supabase
    .from('accounts')
    .update({ used_minutes: newUsedMinutes })
    .eq('twilio_phone_number', normalizedSearch)
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to update used_minutes in Supabase:', error || 'No data returned');
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    twilioPhoneNumber: data.twilio_phone_number,
    allotted_minutes: data.allotted_minutes,
    purchased_minutes: data.purchased_minutes,
    used_minutes: data.used_minutes,
  };
}

// Check available minutes
export function getAvailableMinutes(account: Account): number {
  return (account.allotted_minutes + account.purchased_minutes) - account.used_minutes;
}

