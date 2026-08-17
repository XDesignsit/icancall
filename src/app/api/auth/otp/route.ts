import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/rateLimit";
import { ensureDemoAccount, isDemoEmail, roleForEmail } from "@/lib/demoAccounts";

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
          shouldCreateUser: true, // Auto-create user if they don't exist yet
          captchaToken: captchaToken || undefined,
        },
      });

      if (otpError) {
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

      const role = roleForEmail(email);
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      const sessionToken = await signSession({ email, role, expiresAt, userId: userId || undefined });

      const response = NextResponse.json({ success: true, role });

      // Set secure HTTP-only cookie (SameSite=None is required for iframe preview sandboxes in prod)
      const isProd = process.env.NODE_ENV === "production";
      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("OTP API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
