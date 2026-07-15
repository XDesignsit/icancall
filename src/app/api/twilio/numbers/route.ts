import { NextResponse } from 'next/server';
import {
  searchAvailableNumbers as searchTwilioNumbers,
  isTwilioConfigured,
  telnyxCountryForAreaCode,
} from '@/lib/twilio';
import {
  searchAvailableNumbers as searchTelnyxNumbers,
  isTelnyxConfigured,
} from '@/lib/telnyx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('areaCode') || '415';

    if (!/^\d{3}$/.test(areaCode)) {
      return NextResponse.json({ error: 'Area code must be a 3-digit number' }, { status: 400 });
    }

    // NANP Caribbean area codes (868/246/876/658) are stocked by Telnyx, not
    // Twilio, so route those searches to Telnyx. `configured` reflects the
    // provider actually queried so the client mock-fallback only kicks in when
    // that provider is unconfigured (local dev).
    const telnyxCountry = telnyxCountryForAreaCode(areaCode);

    if (telnyxCountry) {
      const availableNumbers = await searchTelnyxNumbers(telnyxCountry);
      return NextResponse.json({
        success: true,
        configured: isTelnyxConfigured(),
        provider: 'telnyx',
        areaCode,
        results: availableNumbers,
      });
    }

    const availableNumbers = await searchTwilioNumbers(areaCode);

    return NextResponse.json({
      success: true,
      configured: isTwilioConfigured(),
      provider: 'twilio',
      areaCode,
      results: availableNumbers,
    });
  } catch (error) {
    console.error('Numbers API Route Failure:', error);
    return NextResponse.json({ error: 'Failed to retrieve phone numbers' }, { status: 500 });
  }
}
