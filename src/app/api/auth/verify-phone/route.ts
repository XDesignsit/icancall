import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { toE164 } from "@/lib/phone";
import { checkOtp, saveOtp } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, code } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const normalized = toE164(phone);

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === "send") {
      const otp = String(randomInt(100000, 1000000));
      await saveOtp(`phone:${normalized}`, otp);

      const { sendSms } = await import("@/lib/twilio");
      await sendSms(normalized, `Your iCanCall verification code is: ${otp}. It expires in 10 minutes.`);

      return NextResponse.json({ success: true });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
      }

      const check = await checkOtp(`phone:${normalized}`, String(code).replace(/\D/g, ""));
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("verify-phone error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
