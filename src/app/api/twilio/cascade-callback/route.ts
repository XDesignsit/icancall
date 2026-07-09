import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber, type LineContact } from '@/lib/db';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
    let contactIndexStr = requestUrl.searchParams.get('contactIndex');
    let callStatus = requestUrl.searchParams.get('CallStatus');
    let parentCallSid = requestUrl.searchParams.get('parentCallSid');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          room = formData.get('room')?.toString() || room;
          contactIndexStr = formData.get('contactIndex')?.toString() || contactIndexStr;
          callStatus = formData.get('CallStatus')?.toString() || callStatus;
          parentCallSid = formData.get('parentCallSid')?.toString() || parentCallSid;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    if (!room) {
      return new NextResponse('OK');
    }

    const twilioClient = (await import('@/lib/twilio')).default;

    // If the call was answered or completed successfully, do not dial next contact
    if (callStatus === 'completed' || callStatus === 'answered') {
      if (twilioClient && parentCallSid) {
        try {
          await twilioClient.calls(parentCallSid).update({ status: 'completed' });
        } catch (err) {
          console.error('Failed to terminate parent call after completed cascade leg:', err);
        }
      }
      return new NextResponse('OK');
    }

    const nextIdx = contactIndexStr ? parseInt(contactIndexStr, 10) : 0;
    const parts = room.split('_');
    if (parts.length < 2) return new NextResponse('OK');
    
    const activeNumber = '+' + parts[1];
    const account = await findAccountByTwilioNumber(activeNumber);
    const contacts = account?.line?.contacts || [];
    const availableContacts = contacts.filter(
      (c): c is LineContact & { phone: string } => Boolean(c.available && c.phone)
    );

    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    if (twilioClient && nextIdx < availableContacts.length) {
      const nextContact = availableContacts[nextIdx];
      try {
        await twilioClient.calls.create({
          to: nextContact.phone,
          from: activeNumber,
          url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(room)}`,
          statusCallback: `${baseUrl}/api/twilio/cascade-callback?room=${encodeURIComponent(room)}&contactIndex=${nextIdx + 1}&parentCallSid=${encodeURIComponent(parentCallSid || '')}`,
          statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
          timeout: 15
        });
      } catch (err) {
        console.error('Failed to call next contact in cascade:', err);
      }
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Cascade Callback Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
