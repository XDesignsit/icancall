import { NextResponse } from 'next/server';
import { verifyTelephonyWebhook } from '@/lib/twilioWebhook';

export const preferredRegion = 'iad1';

// Twilio's delivery report for every text sendSms sends. A text Twilio
// accepted can still be dropped by the carrier (error 30007 is a filtered
// message, 30034 an unregistered sender); this is the only place that shows.
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  const form = await request.formData();
  const sid = form.get('MessageSid')?.toString() || 'unknown';
  const status = form.get('MessageStatus')?.toString() || 'unknown';
  const errorCode = form.get('ErrorCode')?.toString();
  const to = (form.get('To')?.toString() || '').slice(-4);
  const line = `SMS ${sid} to …${to}: ${status}${errorCode ? ` (Twilio error ${errorCode})` : ''}`;

  if (status === 'failed' || status === 'undelivered') console.error(line);
  else console.log(line);
  return new NextResponse('OK');
}
