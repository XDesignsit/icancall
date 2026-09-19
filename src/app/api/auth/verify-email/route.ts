import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { sendEmail } from "@/lib/mail";
import { checkOtp, saveOtp } from "@/lib/otpStore";
import { ACCOUNT_EXISTS_RESPONSE, isEmailTakenForSignup } from "@/lib/accountLookup";
import { EMAIL_PROOF_COOKIE, EMAIL_PROOF_MAX_AGE_SECONDS, issueEmailProof, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    // ── CHECK ─────────────────────────────────────────────────────────────────
    // Asked by the wizard before it lets the account step through.
    if (action === "check") {
      return (await isEmailTakenForSignup(email))
        ? NextResponse.json(ACCOUNT_EXISTS_RESPONSE, { status: 409 })
        : NextResponse.json({ success: true, available: true });
    }

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === "send") {
      // Tell an existing customer right away, rather than after they have
      // verified, picked numbers and paid.
      if (await isEmailTakenForSignup(email)) {
        return NextResponse.json(ACCOUNT_EXISTS_RESPONSE, { status: 409 });
      }

      const otp = String(randomInt(100000, 1000000));
      await saveOtp(`email:${email.toLowerCase()}`, otp);

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

      const check = await checkOtp(`email:${email.toLowerCase()}`, String(code).trim());
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

      // Keep a server-side record of the verification: /api/auth/signup only
      // signs a new customer in when it sees this proof for their address.
      const response = NextResponse.json({ success: true, verified: true });
      response.cookies.set(EMAIL_PROOF_COOKIE, await issueEmailProof(email), {
        ...sessionCookieOptions(),
        maxAge: EMAIL_PROOF_MAX_AGE_SECONDS,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("verify-email error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
