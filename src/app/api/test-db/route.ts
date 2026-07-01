import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Let's fetch the first profile to get a valid user_id
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json({ success: false, error: 'profile_fetch_err', details: profileErr });
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: "No profiles found in database to test with" });
    }

    const testNum = "+19999999999";

    // Try a test upsert using { onConflict: "number" }
    const { data: upserted, error: upsertError } = await supabase
      .from('phone_lines')
      .upsert({
        user_id: profile.id,
        number: testNum,
        name: "Test Number",
        type: "seniors",
        contacts: []
      }, { onConflict: 'number' })
      .select();

    // Clean up
    if (upserted && upserted.length > 0) {
      await supabase
        .from('phone_lines')
        .delete()
        .eq('number', testNum);
    }

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      upsertResult: upserted,
      upsertError: upsertError
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || err
    });
  }
}
