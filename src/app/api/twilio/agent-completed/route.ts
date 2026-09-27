import { NextResponse } from 'next/server';
import { verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { buildConferenceRoom } from '@/lib/conferenceRoom';
import { releaseCallerIfAlone } from '@/lib/conferenceBridge';

export const preferredRegion = 'iad1';

// Status callback for caregiver legs that are not part of a cascade: every leg
// of a simultaneous-mode call, and the leg placed by a "*" transfer. It fires
// once the leg has ended, answered or not. agent-join also repoints any leg a
// caregiver accepts here, cascade legs included. missed=1 marks a screened leg
// nobody accepted (see conferenceBridge).
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
    // Legs placed before the room was passed here carry only the caller's CallSid.
    const parentCallSid = requestUrl.searchParams.get('parentCallSid');
    const missed = requestUrl.searchParams.get('missed') === '1';
    let callSid = requestUrl.searchParams.get('CallSid');
    let from = requestUrl.searchParams.get('From');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          callSid = formData.get('CallSid')?.toString() || callSid;
          from = formData.get('From')?.toString() || from;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    if (!room && parentCallSid && from) {
      room = buildConferenceRoom(from, parentCallSid);
    }

    // End the caller's leg only if nobody else is still with them or being rung.
    const twilioClient = (await import('@/lib/twilio')).default;
    if (twilioClient && room) {
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      await releaseCallerIfAlone(twilioClient, { room, endedCallSid: callSid, baseUrl, missed });
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Agent Completed Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
