import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client dynamically
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * The only number registered for A2P 10DLC. Every customer-facing SMS -- signup
 * confirmations, phone verification codes, voicemail alerts -- has to originate
 * here, or US carriers filter or drop it and the traffic breaches registration.
 *
 * TWILIO_PHONE_NUMBER stays the knob, but a value that is not registered is a
 * misconfiguration rather than an intent to send from somewhere else, so we say
 * so loudly and send from the approved number anyway.
 */
export const A2P_APPROVED_SENDERS = ['+18542262250'] as const;

/** Resolve the sending number, refusing to send from an unregistered one. */
export function a2pSender(): string {
  const configured = process.env.TWILIO_PHONE_NUMBER?.trim();
  const fallback = A2P_APPROVED_SENDERS[0];
  if (!configured) return fallback;
  if ((A2P_APPROVED_SENDERS as readonly string[]).includes(configured)) return configured;

  console.error(
    `TWILIO_PHONE_NUMBER is ${configured}, which is not A2P 10DLC registered. ` +
    `Sending from ${fallback} instead -- fix the environment variable.`
  );
  return fallback;
}

/** Whether real Twilio credentials are present in this environment. */
export function isTwilioConfigured() {
  return !!client;
}

// U.S. territories share the +1 NANP but are separate countries in Twilio's
// AvailablePhoneNumber API, so an area-code search under 'US' does not return
// them. Map their area codes to the correct ISO country code.
const TERRITORY_COUNTRY_BY_AREA_CODE: Record<string, string> = {
  '787': 'PR', // Puerto Rico
  '939': 'PR', // Puerto Rico (overlay)
  '340': 'VI', // U.S. Virgin Islands
};

// NANP Caribbean markets Twilio does not stock but Telnyx does. These are +1
// numbers, so the app's 3-digit area-code pickers reach them naturally; the
// country code routes the search to Telnyx and its inventory.
const TELNYX_COUNTRY_BY_AREA_CODE: Record<string, string> = {
  '868': 'TT', // Trinidad & Tobago
  '246': 'BB', // Barbados
  '876': 'JM', // Jamaica
  '658': 'JM', // Jamaica (overlay)
};

export type TelephonyProvider = 'twilio' | 'telnyx';

/** ISO country served by Telnyx for a NANP area code, or null if Twilio handles it. */
export function telnyxCountryForAreaCode(areaCode: string): string | null {
  const ac = (areaCode || '').replace(/\D/g, '').slice(0, 3);
  return TELNYX_COUNTRY_BY_AREA_CODE[ac] || null;
}

/** Which provider owns numbers in a given NANP area code. */
export function providerForAreaCode(areaCode: string): TelephonyProvider {
  return telnyxCountryForAreaCode(areaCode) ? 'telnyx' : 'twilio';
}

/**
 * Which provider a full phone number belongs to, by its NANP area code. Accepts
 * E.164 (+1868…) or raw digits; anything non-Caribbean defaults to Twilio.
 */
export function providerForNumber(phoneNumber: string): TelephonyProvider {
  const digits = (phoneNumber || '').replace(/\D/g, '');
  // Strip a leading NANP country code '1' to expose the 3-digit area code.
  const nanp = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return providerForAreaCode(nanp.slice(0, 3));
}

/**
 * Searches for real available local phone numbers by area code. Mainland US
 * area codes search 'US' inventory; U.S. territory area codes (Puerto Rico,
 * U.S. Virgin Islands) search their own ISO country inventory.
 */
export async function searchAvailableNumbers(areaCode: string = '415') {
  if (!client) {
    console.warn('⚠️ Twilio client is not initialized. Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    return [];
  }

  const isoCountry = TERRITORY_COUNTRY_BY_AREA_CODE[areaCode] || 'US';

  try {
    // Territory inventories are small and not area-code filterable, so only
    // pass an areaCode filter for mainland US searches.
    const listParams: { areaCode?: number; limit: number } = { limit: 10 };
    if (isoCountry === 'US') listParams.areaCode = parseInt(areaCode, 10);

    const numbers = await client.availablePhoneNumbers(isoCountry).local.list(listParams);

    return numbers.map((num) => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region,
    }));
  } catch (error) {
    console.error(`❌ Twilio Available Numbers Search failed for area code ${areaCode} (country ${isoCountry}):`, error);
    return [];
  }
}

/**
 * Programmatically purchases a Twilio phone number
 */
export async function purchaseNumber(phoneNumber: string) {
  if (!client) {
    throw new Error('Twilio client not configured');
  }
  return client.incomingPhoneNumbers.create({ phoneNumber });
}

/**
 * Sends an SMS message using the configured A2P-compliant Twilio number
 */
export async function sendSms(to: string, body: string) {
  if (!client) {
    console.warn('⚠️ Twilio client is not initialized. Cannot send SMS.');
    return null;
  }

  const fromNumber = a2pSender();
  
  try {
    const message = await client.messages.create({
      to,
      from: fromNumber,
      body,
    });
    return message;
  } catch (error) {
    console.error(`❌ Twilio SMS dispatch to ${to} failed:`, error);
    throw error;
  }
}

export default client;
