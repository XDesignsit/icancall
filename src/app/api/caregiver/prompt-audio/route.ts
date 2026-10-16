import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { resolveAccount } from '@/lib/account';
import { promptRecordingsOf } from '@/lib/promptRecordings';

/**
 * Plays one of the account's prompt recordings (lib/promptRecordings) back on
 * the dashboard. Storage paths are private, so the file is served only when
 * one of the signed-in account's lines uses it.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const payload = sessionToken ? await verifySession(sessionToken) : null;
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const path = new URL(request.url).searchParams.get('path') || '';
  const { accountId } = await resolveAccount(payload.userId);
  const { data: lines } = await supabase.from('phone_lines').select('settings').eq('user_id', accountId);
  const owned = path.startsWith(`${accountId}/`) && (lines || []).some((l) =>
    Object.values(promptRecordingsOf(l.settings?.extraSettings)).some((r) => r.path === path)
  );
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase.storage.from('voice-prompts').download(path);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(Buffer.from(await data.arrayBuffer()), {
    headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' },
  });
}
