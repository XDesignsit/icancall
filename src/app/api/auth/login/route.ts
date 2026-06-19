import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let emailToAuth = email;
    let passwordToAuth = password;

    // Handle Google Login demo bypass by routing to a seeded demo user
    if (email === "support@icancall.co" && password === "google_oauth_bypass") {
      passwordToAuth = "DemoPassword123!";
      
      // Try to sign in. If it fails, sign up dynamically.
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: passwordToAuth,
      });

      if (authError) {
        // Sign up the demo user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailToAuth,
          password: passwordToAuth,
        });

        if (!signUpError && signUpData.user) {
          // Seed profile
          await supabase.from("profiles").insert({
            id: signUpData.user.id,
            email: emailToAuth,
            name: "Support Demo",
            preferred_name: "Support",
            settings: {
              notifyEmail: emailToAuth,
              smsConsent: true,
              smsPhone: "",
              twoFactor: false,
              card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
              billingAddr: "123 Main St, Oakland, CA 94607",
              plan: "pro",
              billingCycle: "monthly",
              addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
            }
          });

          // Seed default line
          await supabase.from("phone_lines").insert({
            user_id: signUpData.user.id,
            number: "+15005550006",
            name: "Emergency cascaded line",
            type: "seniors",
            contacts: [
              {
                id: 1,
                name: "Support Demo",
                phone: "+14155550192",
                rel: "Primary Caregiver",
                available: true,
              }
            ]
          });
        }
      }
    }

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: passwordToAuth,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }

    const role = email === "admin@icancall.co" ? "admin" : "user";
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const token = await signSession({ email, role, expiresAt, userId: authData.user.id });

    const response = NextResponse.json({ success: true, role });

    const isSecure = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https:");

    // Set secure HTTP-only cookie (SameSite=None is required for iframe preview sandboxes)
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
