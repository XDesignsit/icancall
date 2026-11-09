import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isSessionLive } from "@/lib/userSessions";
import { isVoicemailLocked } from "@/lib/pets";

// A voicemail's audio, for the dashboard's players (the call log and the
// panel the voicemail email opens). Twilio only serves recordings to its own
// account credentials, so a browser cannot play the recording URL itself;
// this streams it, as MP3, to a signed-in owner or member of the account
// whose line took the call. Range requests pass through so players can seek.

async function getAccess(): Promise<{ accountId: string; admin: boolean } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  if (payload.sid && !(await isSessionLive(payload.sid))) return null;
  return { accountId: (await resolveAccount(payload.userId)).accountId, admin: payload.role === "admin" };
}

/** iCanCall admins may play locked pet voicemails only (api/admin/locked-voicemails). */
async function lockedVoicemailForAdmin(sid: string) {
  const { data } = await supabase
    .from("calls")
    .select("recording_url, locked_at")
    .like("recording_url", `%/Recordings/${sid}`)
    .limit(1)
    .maybeSingle();
  return data?.locked_at ? data : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  if (!/^RE[0-9a-f]{32}$/i.test(sid)) return new Response("Not found", { status: 404 });

  const access = await getAccess();
  if (!access) return new Response("Unauthorized", { status: 401 });
  const { accountId } = access;

  const { data: lines } = await supabase.from("phone_lines").select("id").eq("user_id", accountId);
  const lineIds = (lines || []).map((l) => l.id as string);
  const { data: ownCall } = lineIds.length
    ? await supabase
        .from("calls")
        .select("recording_url, locked_at")
        .in("line_id", lineIds)
        .like("recording_url", `%/Recordings/${sid}`)
        .limit(1)
        .maybeSingle()
    : { data: null };
  const adminCall = !ownCall && access.admin ? await lockedVoicemailForAdmin(sid) : null;
  const call = ownCall || adminCall;
  if (!call) return new Response("Not found", { status: 404 });
  const recordingUrl = call?.recording_url as string | undefined;
  if (ownCall?.locked_at) {
    const { data: profile } = await supabase.from("profiles").select("settings").eq("id", accountId).maybeSingle();
    if (isVoicemailLocked(call.locked_at as string, profile?.settings)) {
      return new Response("This voicemail is locked until your line has minutes again.", { status: 403 });
    }
  }
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
