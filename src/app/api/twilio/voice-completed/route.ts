import { NextResponse } from 'next/server';
import { deductMinutes } from '@/lib/db';

export async function POST(request: Request) {
  try {
    let toPhoneNumber = null;
    let durationSeconds = 0;

    // Parse query params first
    const url = new URL(request.url);
    toPhoneNumber = url.searchParams.get('To');

    // Parse Twilio callback form data
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
        const formData = await request.formData();
        
        // Twilio sends DialCallDuration (seconds the dialed call was active) 
        // or CallDuration (total call length). We prioritize DialCallDuration
        const durationStr = formData.get('DialCallDuration') || formData.get('CallDuration');
        if (durationStr) {
          durationSeconds = parseInt(durationStr.toString(), 10);
        }

        toPhoneNumber = toPhoneNumber || formData.get('To');
      }
    } catch (err) {
      console.warn('Could not parse callback form data:', err);
    }

    console.log(`📞 Call completed callback. Number: ${toPhoneNumber}, Duration: ${durationSeconds} seconds.`);

    if (toPhoneNumber && durationSeconds > 0) {
      // Billed minutes are rounded up to the nearest minute
      const minutesUsed = Math.ceil(durationSeconds / 60);
      const updatedAccount = await deductMinutes(toPhoneNumber.toString(), minutesUsed);
      if (updatedAccount) {
        console.log(`✅ Deducted ${minutesUsed} min(s) from account ${updatedAccount.name}. New total used: ${updatedAccount.used_minutes} mins.`);
      } else {
        console.warn(`⚠️ Completed call for unregistered number: ${toPhoneNumber}. No deduction applied.`);
      }
    }

    // Always respond with valid empty TwiML
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('voice-completed Callback Route Failure:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

// Support both GET and POST requests
export async function GET(request: Request) {
  return POST(request);
}
