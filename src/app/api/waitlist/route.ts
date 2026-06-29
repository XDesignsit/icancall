import { NextResponse } from 'next/server';
import { z } from 'zod';

const waitlistSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const { email, phone } = parsed.data;

    const authToken = process.env.ACUMBAMAIL_AUTH_TOKEN;
    const listId = process.env.ACUMBAMAIL_LIST_ID;

    // We check if credentials are set, but if they are placeholders/missing, we log and return error
    if (!authToken || !listId || authToken === 'your_auth_token_here' || listId === 'your_list_id_here') {
      console.error('Acumbamail API credentials are not properly configured.');
      return NextResponse.json(
        { error: 'Waitlist service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Prepare parameters for Acumbamail addSubscriber endpoint
    // Acumbamail expects form-urlencoded payload for older API endpoints
    const formData = new URLSearchParams();
    formData.append('auth_token', authToken);
    formData.append('list_id', listId);
    formData.append('response_type', 'json');
    
    // Pass email as both top-level parameter and merge tag to be compatible with different versions
    formData.append('email', email.trim());
    formData.append('merge_fields[email]', email.trim());

    if (phone) {
      const cleanPhone = phone.trim();
      formData.append('merge_fields[mobile]', cleanPhone);
      formData.append('merge_fields[phone]', cleanPhone);
      formData.append('merge_fields[telefono]', cleanPhone);
    }

    console.log(`[Waitlist API] Sending subscription request to Acumbamail for: ${email}`);

    const response = await fetch('https://acumbamail.com/api/1/addSubscriber/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Waitlist API] Acumbamail API HTTP error status:', response.status, errorText);
      return NextResponse.json(
        { error: 'Unable to register your contact details. Please try again.' },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log('[Waitlist API] Acumbamail response payload:', result);

    // Some APIs return a 200 OK but with error status inside JSON payload
    if (result && (result.status === 'error' || result[0] === -1 || (typeof result === 'string' && result.includes('error')))) {
      console.error('[Waitlist API] Acumbamail reported error in response:', result);
      const msg = result.message || 'Verification failed. Please check your inputs.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Waitlist API] Unexpected error in Waitlist handler:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
