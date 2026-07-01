import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase env variables on server"
      });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        success: false,
        error: "Failed to fetch PostgREST schema",
        status: res.status,
        details: errText
      });
    }

    const swagger = await res.json();
    const tables = Object.keys(swagger.definitions || {});

    return NextResponse.json({
      success: true,
      supabaseUrl,
      tables
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || err
    });
  }
}
