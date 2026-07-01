import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to fetch the seeded test account from the Supabase accounts table
    const account = await findAccountByTwilioNumber('+15005550006');
    
    if (account) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful! Supabase is active and returning data.',
        data: account,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Connected to Supabase, but the test account (+15005550006) was not found. Please verify you ran the SQL seed query to insert the test account.',
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Supabase database. Verify environment variables.',
      error: error.message || error,
    }, { status: 500 });
  }
}
