import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/**
 * Who is signed in, for the signup wizard when it resumes on an existing
 * session. Deliberately separate from /api/caregiver/profile, which refuses
 * to serve an unfinished account (it is what sends people back here).
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const payload = sessionToken ? await verifySession(sessionToken) : null;
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, preferred_name, email")
    .eq("id", payload.userId)
    .maybeSingle();

  return NextResponse.json({
    email: profile?.email || payload.email,
    name: profile?.name || "",
    preferredName: profile?.preferred_name || "",
    onboarding: !!payload.onboarding,
  });
}
