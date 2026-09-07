import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isOnboarded } from "@/lib/onboarding";
import { isSessionLive } from "@/lib/userSessions";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  // A device signed out from the account page has its session row deleted;
  // its cookie is still a valid JWT, so this is where the revocation bites.
  if (payload.sid && !(await isSessionLive(payload.sid))) return null;
  return payload.userId;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The dashboard bounces unfinished accounts back to the wizard. The proxy
    // does the same from the session flag on production hosts; this covers
    // local and preview, where the proxy stays out of the way.
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? await verifySession(sessionToken) : null;
    const sessionEmail = payload?.email || "";
    if (!(await isOnboarded(userId, sessionEmail))) {
      return NextResponse.json({ success: false, onboarding: true, profile: null }, { status: 200 });
    }

    // Care Team members act on the owner's account, so they load the owner's
    // profile (plan, add-ons, billing context) rather than their own.
    const resolved = await resolveAccount(userId);
    if (resolved.role === "member") {
      const { data: ownerProfile, error: ownerErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", resolved.accountId)
        .maybeSingle();
      if (ownerErr || !ownerProfile) {
        return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
      }
      return NextResponse.json({ success: true, profile: ownerProfile, role: "member" });
    }

    // 1. Fetch profile from Supabase
    const { data: fetchedProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    let profile = fetchedProfile;

    if (error) {
      console.error("Failed to fetch profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile data" }, { status: 500 });
    }

    // 2. If no profile exists, create a default one
    if (!profile) {
      const email = sessionEmail || "user@example.com";

      const defaultProfile = {
        id: userId,
        email,
        name: "New Caregiver",
        preferred_name: "Caregiver",
        settings: {
          notifyEmail: email,
          smsConsent: false,
          smsPhone: "",
          twoFactor: false,
          // No card, billing address or plan: this profile is being created for
          // an account that reached the dashboard without going through the
          // wizard, and inventing payment details would put fake card data in a
          // live billing table. The billing UI treats these as "not on file".
          billingCycle: "monthly",
          addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
        }
      };

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert(defaultProfile)
        .select()
        .single();

      if (insertError) {
        console.error("Failed to seed default profile:", insertError);
        return NextResponse.json({ error: "Failed to initialize profile data" }, { status: 500 });
      }
      profile = inserted;
    }

    return NextResponse.json({ success: true, profile, role: "owner" });
  } catch (err) {
    console.error("Caregiver Profile GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Care Team members have full control over lines/contacts/routing (handled
    // by the lines route) but cannot alter account-level profile, billing, or
    // plan settings — those stay with the owner.
    const resolved = await resolveAccount(userId);
    if (resolved.role === "member") {
      return NextResponse.json(
        { error: "Caregivers can't change account or billing settings. Ask the account owner." },
        { status: 403 }
      );
    }

    const { name, preferred_name, settings: newSettings } = await request.json();

    // Fetch existing settings to prevent overwriting payment metadata keys set by webhooks
    const { data: profile } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    const mergedSettings = {
      ...(profile?.settings || {}),
      ...(newSettings || {}),
    };

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        name,
        preferred_name,
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error || !updated) {
      console.error("Failed to update profile:", error);
      return NextResponse.json({ error: "Failed to update profile data" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error("Caregiver Profile POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
