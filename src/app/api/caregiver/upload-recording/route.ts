import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { resolveAccount } from '@/lib/account';

const PLAYABLE_TYPES: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
};

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  return payload?.userId || null;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('audio') as File | null;
    const contactId = formData.get('contactId') as string | null;

    if (!file || !contactId) {
      return NextResponse.json({ error: 'Missing audio file or contact ID' }, { status: 400 });
    }

    // Convert file to array buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // The menu <Play>s this file, so only formats Twilio can play are stored
    // (the dashboard converts browser recordings to WAV before uploading).
    const contentType = (file.type || '').split(';')[0];
    const extension = PLAYABLE_TYPES[contentType];
    if (!extension) {
      return NextResponse.json({ error: 'Recording must be WAV or MP3' }, { status: 415 });
    }

    // Filed under the account owner (a Care Team caregiver records for the
    // owner's lines), which is where the call flow looks for them (lib/promptRecordings).
    const { accountId } = await resolveAccount(userId);
    const filePath = `${accountId}/${contactId.replace(/[^\w-]/g, '_')}.${extension}`;

    // Upload to Supabase storage 'voice-prompts' bucket
    const { error } = await supabase.storage
      .from('voice-prompts')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      filePath: filePath,
    });
  } catch (err) {
    console.error('Caregiver upload-recording route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
