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

    const { text, contactId, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await request.json();

    if (!text || !contactId) {
      return NextResponse.json({ error: 'Missing text or contactId' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'ElevenLabs API Key is not configured on the server' }, { status: 500 });
    }

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs API error response:', errText);
      return NextResponse.json({ error: 'Failed to generate voice from ElevenLabs' }, { status: response.status });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const filePath = `${userId}/${contactId}.mp3`;

    // Upload to Supabase storage 'voice-prompts' bucket
    const { error: uploadError } = await supabase.storage
      .from('voice-prompts')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload generated audio file' }, { status: 500 });
    }

    const { data: signData } = await supabase.storage
      .from('voice-prompts')
      .createSignedUrl(filePath, 3600);

    return NextResponse.json({
      success: true,
      filePath: filePath,
      audioUrl: signData?.signedUrl || null,
    });
  } catch (err: any) {
    console.error('generate-voice API route error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
