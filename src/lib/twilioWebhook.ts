import crypto from 'crypto';
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { providerForNumber } from '@/lib/twilio';

/**
 * Proof that a request to one of the /api/twilio webhooks came from the carrier.
 *
 * Those routes take their instructions from the request itself -- which line,
 * which key the caller pressed, which call to hang up -- so without this check
 * anyone who knows a URL could make a customer's line dial out, end live calls
 * or read the contact list back as TwiML. Every webhook calls
 * verifyTelephonyWebhook() before it does anything else.
 *
 *  - Twilio signs with the account's auth token, over the exact public URL it
 *    fetched plus, for a POST, the form parameters (X-Twilio-Signature). A GET
 *    carries everything in the query string, so only the URL is signed.
 *  - Telnyx serves the Caribbean numbers (providerForNumber) and fetches the
 *    same TeXML URLs, but signs with Ed25519 over "timestamp|raw body"
 *    (telnyx-signature-ed25519, telnyx-timestamp), checked against the
 *    account's public key in TELNYX_PUBLIC_KEY.
 *
 * With no credentials there is nothing to check against, so the check is
 * skipped: local development runs unconfigured, like the other Twilio mocks.
 */

// Telnyx signs a timestamp, not the URL, so a captured request is only
// replayable within this window.
const TELNYX_MAX_AGE_SECONDS = 300;

const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

export interface WebhookOptions {
  /**
   * Telnyx TeXML also reaches this route, and the route takes its line from
   * the To parameter. Routes that find the line some other way (the conference
   * room name) are Twilio-only and must leave this off.
   */
  telnyx?: boolean;
}

/**
 * Null when the request is authentic (or its carrier is unconfigured here);
 * otherwise a 403 for the route to return untouched. Reads a clone of the
 * body, so the route can still parse the request itself afterwards.
 */
export async function verifyTelephonyWebhook(request: Request, opts: WebhookOptions = {}): Promise<NextResponse | null> {
  try {
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const rawBody = hasBody ? await request.clone().text() : '';
    if (isAuthentic(request, rawBody, !!opts.telnyx)) return null;
  } catch (err) {
    console.error('Telephony webhook verification failed:', err);
  }
  console.warn(`Rejected unsigned or forged telephony webhook: ${request.method} ${new URL(request.url).pathname}`);
  return new NextResponse('Forbidden', { status: 403 });
}

function isAuthentic(request: Request, rawBody: string, allowTelnyx: boolean): boolean {
  const params = formParams(request, rawBody);
  const toTelnyxLine = addressedToTelnyxLine(request, params);

  // Whichever carrier the request claims to come from has to vouch for it. A
  // request with neither header is a Telnyx one only if it is for a Telnyx line.
  const claimsTelnyx =
    request.headers.has('telnyx-signature-ed25519') ||
    (!request.headers.has('x-twilio-signature') && toTelnyxLine);

  if (claimsTelnyx) return allowTelnyx && isAuthenticTelnyx(request, rawBody, toTelnyxLine);
  return isAuthenticTwilio(request, params);
}

function isAuthenticTwilio(request: Request, params: Record<string, string | string[]>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    warnOnce('TWILIO_AUTH_TOKEN is not set; Twilio webhook signatures are not being checked.');
    return true;
  }
  const signature = request.headers.get('x-twilio-signature');
  if (!signature) return false;
  return publicUrls(request).some((url) => twilio.validateRequest(authToken, signature, url, params));
}

function isAuthenticTelnyx(request: Request, rawBody: string, toTelnyxLine: boolean): boolean {
  const publicKey = telnyxPublicKey();
  if (!publicKey) {
    // Unverifiable, but a Telnyx line never reaches Twilio's calls.create, so
    // accepting its requests cannot place calls from a Twilio customer's line.
    warnOnce('TELNYX_PUBLIC_KEY is not set; Telnyx TeXML requests are accepted unverified.');
    return toTelnyxLine;
  }
  const signature = request.headers.get('telnyx-signature-ed25519');
  const timestamp = request.headers.get('telnyx-timestamp');
  if (!signature || !timestamp) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TELNYX_MAX_AGE_SECONDS) return false;
  return crypto.verify(null, Buffer.from(`${timestamp}|${rawBody}`), publicKey, Buffer.from(signature, 'base64'));
}

/** The account's Ed25519 key: base64 of the raw 32 bytes as the portal shows it, or PEM. */
function telnyxPublicKey(): crypto.KeyObject | null {
  const value = process.env.TELNYX_PUBLIC_KEY?.trim();
  if (!value) return null;
  if (value.includes('BEGIN PUBLIC KEY')) return crypto.createPublicKey(value);
  const x = Buffer.from(value, 'base64').toString('base64url');
  return crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x }, format: 'jwk' });
}

/** The form parameters a POST was signed over; a GET has none. */
function formParams(request: Request, rawBody: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const contentType = request.headers.get('content-type') || '';
  if (!rawBody || !contentType.includes('application/x-www-form-urlencoded')) return params;
  for (const [key, value] of new URLSearchParams(rawBody)) {
    const seen = params[key];
    params[key] = seen === undefined ? value : ([] as string[]).concat(seen, value);
  }
  return params;
}

/** Every To the request carries, in the query string or the form, is a Telnyx number. */
function addressedToTelnyxLine(request: Request, params: Record<string, string | string[]>): boolean {
  const numbers = [...new URL(request.url).searchParams.getAll('To'), ...([] as string[]).concat(params.To ?? [])];
  return numbers.length > 0 && numbers.every((n) => providerForNumber(n) === 'telnyx');
}

/**
 * The URL the carrier fetched, as it saw it. Behind Vercel the handler's own
 * request.url may carry an internal host or scheme, so rebuild it from the
 * forwarded headers first, and keep request.url and NEXT_PUBLIC_APP_URL (where
 * number purchases point the voice webhook) as fallbacks. Offering several
 * gives a forger nothing: each still has to match the auth token's signature.
 */
function publicUrls(request: Request): string[] {
  const url = new URL(request.url);
  const pathAndQuery = url.pathname + url.search;
  const first = (header: string) => request.headers.get(header)?.split(',')[0].trim() || null;

  const proto = first('x-forwarded-proto') || url.protocol.replace(/:$/, '');
  const host = first('x-forwarded-host') || first('host') || url.host;
  const urls = [`${proto}://${host}${pathAndQuery}`, url.toString()];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (appUrl && URL.canParse(appUrl)) urls.push(`${appUrl}${pathAndQuery}`);
  return [...new Set(urls)];
}

/**
 * TwiML <Play> tag for /api/twilio/tts. Twilio and Telnyx fetch that audio as
 * plain media, without a signature the route could check, so the URL carries
 * its own: an HMAC of the voice and text. Otherwise anyone could spend the
 * ElevenLabs quota on text of their choosing.
 */
export function ttsPlayTag(baseUrl: string, text: string, voiceId: string): string {
  const spoken = text.trim();
  const query = [`text=${encodeURIComponent(spoken)}`, `voiceId=${encodeURIComponent(voiceId)}`];
  const signature = ttsSignature(spoken, voiceId);
  if (signature) query.push(`sig=${signature}`);
  return `<Play>${baseUrl}/api/twilio/tts?${query.join('&amp;')}</Play>`;
}

/** Whether a /api/twilio/tts URL is one ttsPlayTag produced. */
export function isSignedTtsUrl(url: URL): boolean {
  const expected = ttsSignature((url.searchParams.get('text') || '').trim(), url.searchParams.get('voiceId') || '');
  if (!expected) return true; // Unconfigured, as in verifyTelephonyWebhook.
  const given = Buffer.from(url.searchParams.get('sig') || '');
  return given.length === expected.length && crypto.timingSafeEqual(given, Buffer.from(expected));
}

function ttsSignature(text: string, voiceId: string): string | null {
  const key = process.env.TWILIO_AUTH_TOKEN;
  if (!key) return null;
  return crypto.createHmac('sha256', key).update(JSON.stringify(['tts', voiceId, text])).digest('base64url');
}
