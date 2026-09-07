import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/session";
import {
  describeDevice,
  describeLocation,
  endOtherSessions,
  endSession,
  listSessions,
  requestContext,
  touchSession,
} from "@/lib/userSessions";

/**
 * The account page's "Active sessions" panel: the devices signed in to this
 * account, and revoking one of them.
 */

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get("session")?.value;
  const payload = token ? await verifySession(token) : null;
  return payload?.userId ? payload : null;
}

async function activeSessions(payload: SessionPayload, headers: Headers): Promise<ActiveSession[]> {
  const userId = payload.userId as string;
  if (payload.sid) await touchSession(payload.sid);
  const rows = await listSessions(userId);
  const out: ActiveSession[] = rows.map((r) => ({
    id: r.id,
    device: r.device,
    location: describeLocation(r),
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at,
    current: r.id === payload.sid,
  }));
  // A cookie issued before sessions were recorded has no row of its own. The
  // device making this request is still plainly signed in, so show it from
  // the request rather than pretend the list is empty.
  if (!out.some((s) => s.current)) {
    const ctx = requestContext(headers);
    const now = new Date().toISOString();
    out.unshift({
      id: "current",
      device: describeDevice(ctx.userAgent),
      location: describeLocation(ctx),
      createdAt: now,
      lastSeenAt: now,
      current: true,
    });
  }
  return out.sort((a, b) => Number(b.current) - Number(a.current));
}

export async function GET(request: Request) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ sessions: await activeSessions(payload, request.headers) });
  } catch (err) {
    console.error("Failed to list sessions:", err);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

/** Body: { id } signs out one other device; { others: true } signs out all but this one. */
export async function DELETE(request: Request) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = payload.userId as string;
  try {
    const body = (await request.json().catch(() => ({}))) as { id?: string; others?: boolean };
    if (body.others) {
      await endOtherSessions(userId, payload.sid);
    } else if (typeof body.id === "string" && body.id && body.id !== payload.sid && body.id !== "current") {
      await endSession(userId, body.id);
    } else {
      return NextResponse.json({ error: "Use /api/auth/logout to sign out this device." }, { status: 400 });
    }
    return NextResponse.json({ sessions: await activeSessions(payload, request.headers) });
  } catch (err) {
    console.error("Failed to end session:", err);
    return NextResponse.json({ error: "Failed to sign out that device" }, { status: 500 });
  }
}
