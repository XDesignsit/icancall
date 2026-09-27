import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isSessionLive } from "@/lib/userSessions";
import { listCalls, type CallRow } from "@/lib/callRecords";
import { toDisplay, toE164 } from "@/lib/phone";

// The dashboard's call log: the calls every line on the account received
// (public.calls), newest first, grouped by line. Care Team members see the
// owner's lines, as they do everywhere else in the dashboard.

// A call still "ringing" this long after it came in never had its end
// reported (its number's call-status webhook was not set yet), so nobody
// answered it as far as anyone can tell. Younger ones are still going on.
const STALE_RINGING_MS = 30 * 60 * 1000;

interface LineRow {
  id: string;
  contacts: { name?: string; phone?: string }[] | null;
}

async function getAccountId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  if (payload.sid && !(await isSessionLive(payload.sid))) return null;
  return (await resolveAccount(payload.userId)).accountId;
}

function clock(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Where the dashboard plays a voicemail: Twilio serves recordings only to the
 * account's credentials, so through api/caregiver/recordings.
 */
function playable(recordingUrl: string | null): string | null {
  const sid = /\/Recordings\/(RE[0-9a-f]{32})(?:\.\w+)?$/i.exec(recordingUrl || "")?.[1];
  return sid ? `/api/caregiver/recordings/${sid}` : null;
}

function toEntry(call: CallRow, line: LineRow | undefined) {
  const ringing = call.status === "ringing";
  if (ringing && Date.now() - new Date(call.started_at).getTime() < STALE_RINGING_MS) return null;
  const status = ringing ? "missed" : call.status;

  const from = toE164(call.from_number);
  const known = from ? (line?.contacts || []).find((c) => c.phone && toE164(c.phone) === from) : undefined;
  const caller = known?.name?.trim() || (from ? toDisplay(from) : "Unknown");

  return {
    id: call.call_sid,
    status,
    caller,
    routed: status === "connected" ? call.answered_by || "A trusted contact" : "No one available",
    rel: status === "connected" ? call.answered_rel || "" : status === "voicemail" ? "Voicemail left" : "No message left",
    dur: status === "connected" ? clock(call.talk_seconds) : status === "voicemail" ? clock(call.recording_seconds) : "—",
    at: call.started_at,
    transcript: status === "voicemail" ? call.transcript : null,
    recordingUrl: status === "voicemail" ? playable(call.recording_url) : null,
  };
}

export async function GET() {
  try {
    const accountId = await getAccountId();
    if (!accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: lines, error } = await supabase.from("phone_lines").select("id, contacts").eq("user_id", accountId);
    if (error) throw error;
    const byId = new Map(((lines || []) as LineRow[]).map((l) => [l.id, l]));

    const calls: Record<string, NonNullable<ReturnType<typeof toEntry>>[]> = {};
    for (const line of byId.keys()) calls[line] = [];
    for (const row of await listCalls([...byId.keys()])) {
      const entry = toEntry(row, byId.get(row.line_id));
      if (entry) calls[row.line_id]?.push(entry);
    }
    return NextResponse.json({ success: true, calls });
  } catch (err) {
    console.error("Caregiver calls GET error:", err);
    return NextResponse.json({ error: "Failed to load calls" }, { status: 500 });
  }
}
