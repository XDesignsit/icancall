import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session")?.value;
      const payload = sessionToken ? await verifySession(sessionToken) : null;
      const email = payload?.email || "user@example.com";

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
          card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
          billingAddr: "123 Main St, Oakland, CA 94607",
          plan: "pro",
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
