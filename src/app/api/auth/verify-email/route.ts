import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

// In-memory store: email -> { code, expiresAt, attempts }
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === "send") {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      otpStore.set(email.toLowerCase(), { code: otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

      await sendEmail({
        to: email,
        subject: "Your iCanCall verification code",
        text: `Your iCanCall verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #f1f5f9;border-radius:12px;">
            <div style="margin-bottom:20px;"><span style="font-size:1.1rem;font-weight:700;color:#1e3a8a;">iCanCall</span></div>
            <h2 style="color:#0f172a;font-size:1.3rem;font-weight:700;margin:0 0 12px;">Verify your email address</h2>
            <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 24px;">Use the code below to verify your email. It expires in <strong>10 minutes</strong>.</p>
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-size:2rem;font-weight:700;letter-spacing:0.25em;color:#0c4a6e;">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:0.8rem;margin:0;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
      }

      const entry = otpStore.get(email.toLowerCase());

      if (!entry) {
        return NextResponse.json({ error: "No code was sent to this address. Please request a new one." }, { status: 400 });
      }

      if (Date.now() > entry.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
      }

      entry.attempts += 1;
      if (entry.attempts > MAX_ATTEMPTS) {
        otpStore.delete(email.toLowerCase());
        return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
      }

      if (code !== entry.code) {
        return NextResponse.json({ error: `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` }, { status: 400 });
      }

      otpStore.delete(email.toLowerCase());
      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("verify-email error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
