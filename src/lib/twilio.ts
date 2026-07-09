import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client dynamically
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// U.S. territories share the +1 NANP but are separate countries in Twilio's
// AvailablePhoneNumber API, so an area-code search under 'US' does not return
// them. Map their area codes to the correct ISO country code.
const TERRITORY_COUNTRY_BY_AREA_CODE: Record<string, string> = {
  '787': 'PR', // Puerto Rico
  '939': 'PR', // Puerto Rico (overlay)
  '340': 'VI', // U.S. Virgin Islands
};

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

  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+18542262250';
  
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
