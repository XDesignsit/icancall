import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { isMock, supabase } from "@/lib/supabase";
import { toDisplay } from "@/lib/phone";

// Pet-line voicemails left while the line was out of minutes (lib/pets). The
// owner cannot open them until they renew or the minutes reset, so iCanCall
// admins see them here, with the caller's number, to help a found pet home.
// Audio plays through api/caregiver/recordings, which lets admins open locked
// voicemails only.

async function isAdmin(): Promise<boolean> {
  const sessionToken = (await cookies()).get("session")?.value;
  if (!sessionToken) return false;
  const payload = await verifySession(sessionToken);
  return payload?.role === "admin";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // The local mock client only implements eq(); it filters in memory instead.
    const query = supabase.from("calls").select("call_sid, line_id, from_number, recording_url, recording_seconds, started_at, locked_at");
    const { data: calls, error } = isMock
      ? await query
      : await query.not("locked_at", "is", null).order("locked_at", { ascending: false }).limit(200);
    if (error) throw error;
    const locked = (calls || []).filter((c) => c.locked_at);

    const lineIds = [...new Set(locked.map((c) => c.line_id as string))];
    const { data: lines } = lineIds.length ? await supabase.from("phone_lines").select("id, number, name, user_id").in("id", lineIds) : { data: [] };
    const lineById = new Map((lines || []).map((l) => [l.id as string, l]));
    const userIds = [...new Set((lines || []).map((l) => l.user_id as string))];
    const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, name, email").in("id", userIds) : { data: [] };
    const profileById = new Map((profiles || []).map((p) => [p.id as string, p]));

    const voicemails = locked.map((c) => {
      const line = lineById.get(c.line_id as string);
      const owner = line ? profileById.get(line.user_id as string) : undefined;
      const sid = /\/Recordings\/(RE[0-9a-f]{32})/i.exec((c.recording_url as string) || "")?.[1];
      return {
        id: c.call_sid,
        caller: c.from_number ? toDisplay(c.from_number as string) : "Unknown",
        at: c.started_at,
        seconds: c.recording_seconds,
        line: line ? toDisplay(line.number as string) : "",
        owner: owner ? `${owner.name || ""} (${owner.email || ""})`.trim() : "",
        audioUrl: sid ? `/api/caregiver/recordings/${sid}` : null,
      };
    });
    return NextResponse.json({ voicemails });
  } catch (err) {
    console.error("Locked voicemails lookup failed:", err);
    return NextResponse.json({ error: "Could not load locked voicemails" }, { status: 500 });
  }
}
