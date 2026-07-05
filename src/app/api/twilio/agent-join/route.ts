import { NextResponse } from 'next/server';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          room = formData.get('room')?.toString() || room;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    if (!room) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: No conference room specified.</Say></Response>', {
        status: 400,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    // Connect the caregiver to the conference room
    // hangupOnStar="true": enables them to press * to leave and trigger the action callback
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial hangupOnStar="true" action="/api/twilio/agent-transfer?room=${encodeURIComponent(room)}" method="POST">
    <Conference beep="false" endConferenceOnExit="false" startConferenceOnEnter="true">
      ${room}
    </Conference>
  </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Agent Join Webhook Error:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>A system error occurred. Goodbye.</Say></Response>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
