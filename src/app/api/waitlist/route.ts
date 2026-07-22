import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addAcumbamailSubscriber } from '@/lib/acumbamail';

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

    const listId = process.env.ACUMBAMAIL_LIST_ID;
    const cleanPhone = phone?.trim();

    console.log(`[Waitlist API] Subscribing to Coming Soon list for: ${email}`);

    // Route through the shared helper so the waitlist behaves like the paid
    // signup path: fail-soft on missing creds and, crucially, pass
    // welcome_email=1 to trigger the list's configured welcome autoresponder.
    const result = await addAcumbamailSubscriber({
      listId,
      email,
      welcomeEmail: true,
      mergeFields: {
        mobile: cleanPhone,
        phone: cleanPhone,
        telefono: cleanPhone,
      },
    });

    if (!result.success) {
      if (result.error === 'not_configured') {
        console.error('[Waitlist API] Acumbamail API credentials are not properly configured.');
        return NextResponse.json(
          { error: 'Waitlist service is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
      console.error('[Waitlist API] Acumbamail subscription failed:', result.error);
      return NextResponse.json(
        { error: 'Unable to register your contact details. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { subscriberId: result.subscriberId } });
  } catch (error) {
    console.error('[Waitlist API] Unexpected error in Waitlist handler:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
