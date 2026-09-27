import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resolveAccount } from "@/lib/account";
import { isSessionLive } from "@/lib/userSessions";
import { invalidateCachedAccount } from "@/lib/db";
import { checkOtp, saveOtp } from "@/lib/otpStore";
import { toDisplay, toE164 } from "@/lib/phone";

// Text call alerts (Account → Contact info): the account owner turns them on
// for a mobile number by proving they hold it with a texted code, which is
// also the consent record carriers expect for A2P messaging. The profile
// route refuses smsConsent / smsPhone from the browser, so this is the only
// way they change after signup.
//
//   { action: "send", phone }          text a code to the number
//   { action: "verify", phone, code }  check it; alerts go to that number
//   { action: "disable" }              stop the alerts

async function getOwnerId(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const payload = sessionToken ? await verifySession(sessionToken) : null;
  if (!payload?.userId || (payload.sid && !(await isSessionLive(payload.sid)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = await resolveAccount(payload.userId);
  if (resolved.role === "member") {
    return NextResponse.json({ error: "Only the account owner can change text alerts." }, { status: 403 });
  }
  return payload.userId;
}

async function updateSettings(userId: string, patch: Record<string, unknown>): Promise<boolean> {
  const { data: profile } = await supabase.from("profiles").select("settings").eq("id", userId).maybeSingle();
  const { error } = await supabase
    .from("profiles")
    .update({ settings: { ...(profile?.settings || {}), ...patch }, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.error("sms-alerts: could not save settings:", error);
    return false;
  }
  // The voice webhooks read smsPhone through the per-number account cache.
  const { data: lines } = await supabase.from("phone_lines").select("number").eq("user_id", userId);
  (lines || []).forEach((l) => l.number && invalidateCachedAccount(l.number));
  return true;
}

export async function POST(request: Request) {
  try {
    const owner = await getOwnerId();
    if (owner instanceof NextResponse) return owner;

    const { action, phone, code } = await request.json();
    const { sendSms } = await import("@/lib/twilio");

    if (action === "disable") {
      if (!(await updateSettings(owner, { smsConsent: false }))) {
        return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const number = toE164(phone);
    if (!/^\+1\d{10}$/.test(number)) {
      return NextResponse.json({ error: "Enter a valid US mobile number." }, { status: 400 });
    }
    const otpId = `sms-alerts:${owner}:${number}`;

    if (action === "send") {
      const otp = String(randomInt(100000, 1000000));
      await saveOtp(otpId, otp);
      await sendSms(number, `Your iCanCall code to turn on call alerts is ${otp}. It expires in 10 minutes.`);
      return NextResponse.json({ success: true });
    }

    if (action === "verify") {
      const check = await checkOtp(otpId, String(code || "").replace(/\D/g, ""));
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
      const saved = await updateSettings(owner, {
        smsConsent: true,
        smsPhone: number,
        smsConsentAt: new Date().toISOString(),
        smsConsentSource: "dashboard",
      });
      if (!saved) return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
      try {
        await sendSms(
          number,
          "iCanCall: Call alerts are on for this number. You'll get a text when a call to your iCanCall line is answered, missed or leaves a voicemail. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out."
        );
      } catch (err) {
        console.error("sms-alerts: confirmation text failed:", err);
      }
      return NextResponse.json({ success: true, smsPhone: number, display: toDisplay(number) });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("sms-alerts error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
