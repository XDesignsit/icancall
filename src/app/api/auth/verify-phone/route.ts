import { NextResponse } from "next/server";
import { randomInt } from "crypto";

// In-memory store: normalizedPhone -> { code, expiresAt, attempts }
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, code } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === "send") {
      const otp = String(randomInt(100000, 1000000));
      otpStore.set(normalized, { code: otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

      const { sendSms } = await import("@/lib/twilio");
      await sendSms(normalized, `Your iCanCall verification code is: ${otp}. It expires in 10 minutes.`);

      return NextResponse.json({ success: true });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
      }

      const entry = otpStore.get(normalized);

      if (!entry) {
        return NextResponse.json({ error: "No code was sent to this number. Please request a new one." }, { status: 400 });
      }

      if (Date.now() > entry.expiresAt) {
        otpStore.delete(normalized);
        return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
      }

      entry.attempts += 1;
      if (entry.attempts > MAX_ATTEMPTS) {
        otpStore.delete(normalized);
        return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
      }

      if (code !== entry.code) {
        return NextResponse.json({ error: `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` }, { status: 400 });
      }

      otpStore.delete(normalized);
      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("verify-phone error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
