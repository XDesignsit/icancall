import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isSessionLive } from "@/lib/userSessions";

// A voicemail's audio, for the dashboard's players (the call log and the
// panel the voicemail email opens). Twilio only serves recordings to its own
// account credentials, so a browser cannot play the recording URL itself;
// this streams it, as MP3, to a signed-in owner or member of the account
// whose line took the call. Range requests pass through so players can seek.

async function getAccountId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  if (payload.sid && !(await isSessionLive(payload.sid))) return null;
  return (await resolveAccount(payload.userId)).accountId;
}

export async function GET(request: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  if (!/^RE[0-9a-f]{32}$/i.test(sid)) return new Response("Not found", { status: 404 });

  const accountId = await getAccountId();
  if (!accountId) return new Response("Unauthorized", { status: 401 });

  const { data: lines } = await supabase.from("phone_lines").select("id").eq("user_id", accountId);
  const lineIds = (lines || []).map((l) => l.id as string);
  if (lineIds.length === 0) return new Response("Not found", { status: 404 });
  const { data: call } = await supabase
    .from("calls")
    .select("recording_url")
    .in("line_id", lineIds)
    .like("recording_url", `%/Recordings/${sid}`)
    .limit(1)
    .maybeSingle();
  const recordingUrl = call?.recording_url as string | undefined;
  if (!recordingUrl || !recordingUrl.startsWith("https://api.twilio.com/")) {
    return new Response("Not found", { status: 404 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return new Response("Recordings are unavailable", { status: 503 });

  const range = request.headers.get("range");
  const upstream = await fetch(`${recordingUrl}.mp3`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      ...(range ? { Range: range } : {}),
    },
  });
  if (!upstream.ok || !upstream.body) {
    console.error(`Recording ${sid}: Twilio answered ${upstream.status}`);
    return new Response("Recording unavailable", { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers({
    "Content-Type": "audio/mpeg",
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  });
  for (const name of ["content-length", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
