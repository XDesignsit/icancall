import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const voiceId = searchParams.get('voiceId') || '21m00Tcm4TlvDq8ikWAM'; // Rachel is default

    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.warn('⚠️ ElevenLabs API Key is not configured on the server. Falling back to simple response.');
      return NextResponse.json({ error: 'ElevenLabs API Key is not configured on the server' }, { status: 500 });
    }

    // 1. Generate cache key based on voiceId and text
    const encoder = new TextEncoder();
    const textData = encoder.encode(`${voiceId}:${text.trim()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const filePath = `tts/${hashHex}.mp3`;

    // 2. Try to download from Supabase Storage 'voice-prompts' bucket
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('voice-prompts')
      .download(filePath);

    if (fileData && !downloadError) {
      const arrayBuffer = await fileData.arrayBuffer();
      return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 3. Cache miss: Call ElevenLabs Text-to-Speech API
    console.log(`🎙️ TTS Cache Miss. Requesting ElevenLabs generation for text: "${text.substring(0, 40)}..." using voice: ${voiceId}`);
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2', // Multilingual supports different language accents correctly
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ ElevenLabs API error response:', errText);
      return NextResponse.json({ error: 'Failed to generate voice from ElevenLabs' }, { status: response.status });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // 4. Upload asynchronously to Supabase Storage 'voice-prompts' bucket in the background
    // (don't block the caller's audio delivery waiting for the storage upload to complete)
    supabase.storage
      .from('voice-prompts')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })
      .then((res: any) => {
        if (res.error) {
          console.error('❌ Supabase storage upload error:', res.error);
        } else {
          console.log(`✅ Cached generated TTS in Supabase Storage at: ${filePath}`);
        }
      })
      .catch((uploadErr: any) => {
        console.error('❌ Background upload exception:', uploadErr);
      });

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (err: any) {
    console.error('❌ TTS API route failure:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Fallback POST support
export async function POST(request: Request) {
  return GET(request);
}
