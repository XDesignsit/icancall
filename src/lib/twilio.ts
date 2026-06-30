import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client dynamically
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Searches for real available local phone numbers in the US by area code
 */
export async function searchAvailableNumbers(areaCode: string = '415') {
  if (!client) {
    console.warn('⚠️ Twilio client is not initialized. Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    return [];
  }

  try {
    const numbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: parseInt(areaCode, 10),
      limit: 10,
    });

    return numbers.map((num) => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region,
    }));
  } catch (error) {
    console.error(`❌ Twilio Available Numbers Search failed for area code ${areaCode}:`, error);
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
