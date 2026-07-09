import { NextResponse } from 'next/server';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const parentCallSid = requestUrl.searchParams.get('parentCallSid');

    // When the caregiver hangs up, terminate the caller's leg (parentCallSid)
    const twilioClient = (await import('@/lib/twilio')).default;
    if (twilioClient && parentCallSid) {
      try {
        await twilioClient.calls(parentCallSid).update({ status: 'completed' });
      } catch (err) {
        console.error('Failed to terminate parent call after caregiver hangup:', err);
      }
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
