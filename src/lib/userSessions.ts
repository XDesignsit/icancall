import { supabase } from "./supabase";
import { SESSION_MAX_AGE_SECONDS } from "./session";

// The session cookie is a stateless JWT, so on its own it cannot tell the
// account page which devices are signed in, nor be revoked from another
// device. Every cookie issued at sign-in therefore also gets a row here, keyed
// by the `sid` claim inside the token. Listing the rows is the "Active
// sessions" panel; deleting one signs that device out the next time the
// dashboard loads (see /api/caregiver/profile).

export interface SessionRow {
  id: string;
  user_id: string;
  device: string;
  user_agent: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface RequestContext {
  userAgent: string;
  ip: string;
  city: string;
  region: string;
  country: string;
}

/** "Chrome · Mac", "Safari · iPhone", ... from a User-Agent string. */
export function describeDevice(ua: string): string {
  const u = ua || "";
  const browser =
    /iCanCall/i.test(u) ? "iCanCall app"
    : /Edg(e|A|iOS)?\//.test(u) ? "Edge"
    : /OPR\/|Opera/.test(u) ? "Opera"
    : /SamsungBrowser/.test(u) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(u) ? "Firefox"
    : /CriOS|Chrome\//.test(u) ? "Chrome"
    : /Safari\//.test(u) ? "Safari"
    : "";
  const os =
    /iPhone/.test(u) ? "iPhone"
    : /iPad/.test(u) || (/Macintosh/.test(u) && /Mobile/.test(u)) ? "iPad"
    : /Android/.test(u) ? "Android"
    : /Windows/.test(u) ? "Windows"
    : /Macintosh|Mac OS X/.test(u) ? "Mac"
    : /CrOS/.test(u) ? "Chromebook"
    : /Linux/.test(u) ? "Linux"
    : "";
  return [browser, os].filter(Boolean).join(" · ");
}

/** Pull device and location facts from the request (Vercel geo headers). */
export function requestContext(headers: Headers): RequestContext {
  const decode = (v: string | null) => {
    try {
      return decodeURIComponent(v || "");
    } catch {
      return v || "";
    }
  };
  const forwarded = headers.get("x-forwarded-for") || "";
  return {
    userAgent: (headers.get("user-agent") || "").slice(0, 500),
    ip: (forwarded.split(",")[0] || headers.get("x-real-ip") || "").trim(),
    city: decode(headers.get("x-vercel-ip-city")),
    region: decode(headers.get("x-vercel-ip-country-region")),
    country: decode(headers.get("x-vercel-ip-country")),
  };
}

export function describeLocation(row: Pick<SessionRow, "city" | "region" | "country">): string {
  if (row.city && row.region) return `${row.city}, ${row.region}`;
  return row.city || row.region || row.country || "";
}

/**
 * Register a new signed-in device and return its id for the cookie. Never
 * throws: a database hiccup must not turn into a failed login, so the cookie
 * is issued without a `sid` and the device simply will not be listed.
 */
export async function startSession(userId: string, headers: Headers): Promise<string | undefined> {
  const id = crypto.randomUUID();
  const ctx = requestContext(headers);
  const now = new Date();
  try {
    const { error } = await supabase.from("user_sessions").insert({
      id,
      user_id: userId,
      device: describeDevice(ctx.userAgent),
      user_agent: ctx.userAgent,
      ip: ctx.ip,
      city: ctx.city,
      region: ctx.region,
      country: ctx.country,
      created_at: now.toISOString(),
      last_seen_at: now.toISOString(),
      expires_at: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
    });
    if (error) {
      console.error("Failed to record session:", error);
      return undefined;
    }
    return id;
  } catch (err) {
    console.error("Failed to record session:", err);
    return undefined;
  }
}

/** Whether a session row still exists and has not expired. */
export async function isSessionLive(sid: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_sessions")
      .select("id, expires_at")
      .eq("id", sid)
      .maybeSingle();
    return !!data && new Date(data.expires_at).getTime() > Date.now();
  } catch (err) {
    // Fail open: a database outage should not sign everyone out.
    console.error("Failed to check session:", err);
    return true;
  }
}

export async function touchSession(sid: string): Promise<void> {
  try {
    await supabase
      .from("user_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", sid);
  } catch (err) {
    console.error("Failed to touch session:", err);
  }
}

/** Live sessions for a user, most recently active first. Expired rows are pruned. */
export async function listSessions(userId: string): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (data || []) as SessionRow[];
  const now = Date.now();
  const expired = rows.filter((r) => new Date(r.expires_at).getTime() <= now);
  for (const r of expired) {
    await supabase.from("user_sessions").delete().eq("id", r.id);
  }
  return rows
    .filter((r) => new Date(r.expires_at).getTime() > now)
    .sort((x, y) => new Date(y.last_seen_at).getTime() - new Date(x.last_seen_at).getTime());
}

/** Revoke one of the user's sessions. Scoped by user so an id alone is not enough. */
export async function endSession(userId: string, sid: string): Promise<void> {
  await supabase.from("user_sessions").delete().eq("id", sid).eq("user_id", userId);
}

/** Revoke every session of the user except the one making the request. */
export async function endOtherSessions(userId: string, keepSid: string | undefined): Promise<void> {
  const rows = await listSessions(userId);
  for (const r of rows) {
    if (r.id !== keepSid) await endSession(userId, r.id);
  }
}
