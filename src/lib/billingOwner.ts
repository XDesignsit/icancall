import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { isSessionLive } from "@/lib/userSessions";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";

// Shared by the routes that act on the account's Creem subscription
// (api/creem/change-plan, api/creem/cancel-subscription).

export type Settings = Record<string, unknown>;

// Session → the account owner allowed to manage the subscription, or the
// error response to send back.
export async function authorizeOwner(): Promise<{ userId: string; email: string } | NextResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const payload = sessionToken ? await verifySession(sessionToken) : null;
  if (!payload?.userId || (payload.sid && !(await isSessionLive(payload.sid)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The subscription belongs to the account owner; caregivers can't touch it.
  const resolved = await resolveAccount(payload.userId);
  if (resolved.role === "member") {
    return NextResponse.json(
      { error: "Caregivers can't change account or billing settings. Ask the account owner." },
      { status: 403 }
    );
  }
  return { userId: payload.userId, email: payload.email };
}

export async function loadSettings(userId: string): Promise<Settings> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  return (profile?.settings as Settings) || {};
}

