import { NextResponse } from "next/server";
import { issueSession, sessionCookieOptions } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/rateLimit";
import { ensureDemoAccount, isDemoEmail } from "@/lib/demoAccounts";
import { resolveSessionRole } from "@/lib/roles";
import { isOnboarded } from "@/lib/onboarding";
import { startSession } from "@/lib/userSessions";

export async function POST(request: Request) {
  try {
    const { action, email, token, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const isDemo = isDemoEmail(email);

    // ==========================================
    // ACTION: SEND OTP
    // ==========================================
    if (action === "send") {
      if (isDemo) {
        // Simulate successful OTP send for demo users
        return NextResponse.json({ success: true, message: "Demo OTP simulated successfully" });
      }

      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      // Verify captchaToken if TURNSTILE_SECRET_KEY is configured
      if (process.env.TURNSTILE_SECRET_KEY && !captchaToken) {
        return NextResponse.json({ error: "CAPTCHA token is required." }, { status: 400 });
      }

      if (captchaToken) {
        const isValid = await verifyTurnstile(captchaToken, ip);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid CAPTCHA validation." }, { status: 400 });
        }
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // The login page signs people in; it must not mint accounts. A PIN
          // for an unknown address used to create a bare auth user that then
          // reached the dashboard with no plan, no number and seeded sample
          // data. New customers go through the signup wizard instead.
          shouldCreateUser: false,
          captchaToken: captchaToken || undefined,
        },
      });

      if (otpError) {
        if (/signups? not allowed/i.test(otpError.message) || otpError.code === "otp_disabled") {
          return NextResponse.json(
            { error: "We couldn't find an account for that email. Please sign up first.", code: "no_account" },
            { status: 404 }
          );
        }
        console.error("Supabase OTP Send Error:", otpError);
        return NextResponse.json({ error: otpError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "OTP sent successfully" });
    }

    // ==========================================
    // ACTION: VERIFY OTP
    // ==========================================
    if (action === "verify") {
      if (!token) {
        return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
      }

      let userId: string | null = null;

      if (isDemo) {
        // Bypass verification code for demo users if code is 123456
        if (token !== "123456") {
          return NextResponse.json({ error: "Invalid verification code for demo account." }, { status: 400 });
        }

        try {
          // Fetch or self-heal demo account (auth user, profile and seeded lines)
          userId = await ensureDemoAccount(email);
        } catch (adminErr) {
          console.error("Demo admin setup error:", adminErr);
          return NextResponse.json({ error: "Failed setting up demo session." }, { status: 500 });
        }
      } else {
        // Normal Supabase Auth OTP verification path
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });

        if (verifyError || !verifyData.user) {
          console.error("Supabase OTP Verify Error:", verifyError);
          return NextResponse.json({ error: verifyError?.message || "Invalid or expired verification code." }, { status: 400 });
        }

        userId = verifyData.user.id;
      }

      const role = await resolveSessionRole(userId, email);
      // Someone who authenticated (say, via Google) but never finished the
      // wizard gets an onboarding-only session and is sent back to it.
      const onboarded = await isOnboarded(userId, email);
      const sid = await startSession(userId, request.headers);
      const sessionToken = await issueSession({ email, role, userId, onboarding: !onboarded, sid });

      const response = NextResponse.json({ success: true, role, onboarding: !onboarded });
      response.cookies.set("session", sessionToken, sessionCookieOptions());
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("OTP API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
