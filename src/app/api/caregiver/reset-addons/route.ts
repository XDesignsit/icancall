import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  return payload?.userId || null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to your dashboard first." }, { status: 401 });
    }

    // 1. Fetch the existing caregiver profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Profile not found or fetch failed." }, { status: 404 });
    }

    // 2. Set extraNumbers addon value to 0
    const settings = profile.settings || {};
    settings.addons = {
      ...(settings.addons || {}),
      extraNumbers: 0
    };

    // 3. Save it back to the database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ settings })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully reset extraNumbers to 0 in your database profile! Now please clear your browser's local storage and refresh."
    });
  } catch (err: any) {
    console.error("Failed to reset addons:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
