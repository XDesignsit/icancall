// Telnyx provider — supplies local phone numbers in NANP Caribbean markets that
// Twilio does not stock (Trinidad & Tobago, Barbados, Jamaica). Telnyx's TeXML
// voice markup is TwiML-compatible, so inbound calls to Telnyx numbers reuse the
// same voice webhook (`/api/twilio/voice`) as Twilio numbers. This module mirrors
// the shape of `src/lib/twilio.ts` so callers can stay provider-agnostic.

const TELNYX_API = 'https://api.telnyx.com/v2';

const apiKey = process.env.TELNYX_API_KEY;

/** Whether real Telnyx credentials are present in this environment. */
export function isTelnyxConfigured() {
  return !!apiKey;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

interface TelnyxAvailableNumber {
  phone_number: string;
  region_information?: { region_type: string; region_name: string }[];
  cost_information?: { monthly_cost: string; upfront_cost: string; currency: string };
}

/**
 * Searches for real available local phone numbers in a Telnyx-served country.
 * `countryCode` is an ISO 3166-1 alpha-2 code (e.g. 'TT', 'BB', 'JM'). Returns
 * the same shape as `searchAvailableNumbers` in `twilio.ts` so the number-search
 * API route can treat both providers uniformly.
 */
export async function searchAvailableNumbers(countryCode: string) {
  if (!apiKey) {
    console.warn('⚠️ Telnyx is not configured. Please set TELNYX_API_KEY.');
    return [];
  }

  // filter[country_code] is required on every Telnyx number search; local
  // (geographic) numbers are what iCanCall provisions for these markets.
  const params = new URLSearchParams();
  params.set('filter[country_code]', countryCode);
  params.set('filter[phone_number_type]', 'local');
  params.set('filter[limit]', '10');

  try {
    const res = await fetch(`${TELNYX_API}/available_phone_numbers?${params.toString()}`, {
      headers: authHeaders(),
      // Number inventory is not user-specific; let Next cache briefly.
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`❌ Telnyx number search failed for country ${countryCode}: ${res.status} ${await res.text()}`);
      return [];
    }

    const body = (await res.json()) as { data?: TelnyxAvailableNumber[] };
    const numbers = body.data || [];

    return numbers.map((num) => {
      const locality = num.region_information?.find((r) => r.region_type === 'locality')?.region_name;
      const region = num.region_information?.find(
        (r) => r.region_type === 'state' || r.region_type === 'country_code'
      )?.region_name;
      return {
        // Telnyx returns E.164 without a leading '+'; normalize to match Twilio.
        phoneNumber: num.phone_number.startsWith('+') ? num.phone_number : `+${num.phone_number}`,
        friendlyName: num.phone_number,
        locality: locality || null,
        region: region || countryCode,
      };
    });
  } catch (error) {
    console.error(`❌ Telnyx number search error for country ${countryCode}:`, error);
    return [];
  }
}

/**
 * Programmatically orders a Telnyx phone number. Defined for parity with
 * `twilio.ts`; not called today — carrier provisioning and TeXML Application /
 * voice-webhook assignment are handled manually in the Telnyx portal for the
 * Caribbean rollout.
 */
export async function purchaseNumber(phoneNumber: string) {
  if (!apiKey) {
    throw new Error('Telnyx client not configured');
  }
  const res = await fetch(`${TELNYX_API}/number_orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ phone_numbers: [{ phone_number: phoneNumber }] }),
  });
  if (!res.ok) {
    throw new Error(`Telnyx number order failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Sends an SMS from a Telnyx number. Only used when the sending line is a Telnyx
 * (Caribbean) number; the default SMS path stays on Twilio. Requires a Telnyx
 * messaging profile / from number.
 */
export async function sendSms(to: string, body: string, from?: string) {
  if (!apiKey) {
    console.warn('⚠️ Telnyx is not configured. Cannot send SMS.');
    return null;
  }

  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const fromNumber = from || process.env.TELNYX_PHONE_NUMBER;

  if (!fromNumber && !messagingProfileId) {
    console.warn('⚠️ Telnyx SMS needs TELNYX_PHONE_NUMBER or TELNYX_MESSAGING_PROFILE_ID.');
    return null;
  }

  try {
    const payload: Record<string, string> = { to, text: body };
    if (fromNumber) payload.from = fromNumber;
    if (messagingProfileId) payload.messaging_profile_id = messagingProfileId;

    const res = await fetch(`${TELNYX_API}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`❌ Telnyx SMS dispatch to ${to} failed: ${res.status} ${await res.text()}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`❌ Telnyx SMS dispatch to ${to} error:`, error);
    return null;
  }
}
