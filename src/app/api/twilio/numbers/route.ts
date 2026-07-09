import { NextResponse } from 'next/server';
import { searchAvailableNumbers, isTwilioConfigured } from '@/lib/twilio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('areaCode') || '415';

    if (!/^\d{3}$/.test(areaCode)) {
      return NextResponse.json({ error: 'Area code must be a 3-digit number' }, { status: 400 });
    }

    const availableNumbers = await searchAvailableNumbers(areaCode);

    return NextResponse.json({
      success: true,
      configured: isTwilioConfigured(),
      areaCode,
      results: availableNumbers,
    });
  } catch (error) {
    console.error('Numbers API Route Failure:', error);
    return NextResponse.json({ error: 'Failed to retrieve phone numbers' }, { status: 500 });
  }
}
