import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isSignedRecordingUrl } from '@/lib/twilioWebhook';
import { isOwnRecording } from '@/lib/voices';

/**
 * A stored prompt recording (lib/promptRecordings) for Twilio to <Play>. The
 * URL is signed by recordingPlayTag; Twilio fetches media without a webhook
 * signature of its own. Each recording has its own path, so the audio behind
 * a URL never changes and can be cached.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  if (!isSignedRecordingUrl(url) || !isOwnRecording(path)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }
  const { data, error } = await supabase.storage.from('voice-prompts').download(path);
  if (error || !data) {
    console.error('Prompt recording not found:', path, error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return new NextResponse(Buffer.from(await data.arrayBuffer()), {
    headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

export async function POST(request: Request) {
  return GET(request);
}
