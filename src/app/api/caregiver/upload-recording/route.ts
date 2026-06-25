import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

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
    
    // File type detection
    const contentType = file.type || 'audio/webm';
    const extension = contentType.split('/')[1] || 'webm';
    
    const filePath = `${userId}/${contactId}.${extension}`;

    // Upload to Supabase storage 'voice-prompts' bucket
    const { data, error } = await supabase.storage
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
