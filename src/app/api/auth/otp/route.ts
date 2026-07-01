import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const { action, email, token, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const isDemoCaregiver = email === "support@icancall.co";
    const isDemoAdmin = email === "admin@icancall.co";
    const isDemo = isDemoCaregiver || isDemoAdmin;

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
          // Fetch or self-heal demo account
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw listError;

          const existingUser = (users || []).find((u: any) => u.email === email);

          if (existingUser) {
            userId = existingUser.id;
          } else {
            // Dynamic registration & auto-confirmation
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
              email,
              password: isDemoAdmin ? "AdminPassword123!" : "DemoPassword123!",
              email_confirm: true
            });

            if (createError || !created.user) {
              throw createError || new Error("User creation failed");
            }
            userId = created.user.id;
          }

          // Force self-healing profile row check
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

          if (!profile) {
            if (isDemoCaregiver) {
              await supabase.from("profiles").insert({
                id: userId,
                email,
                name: "Support Demo",
                preferred_name: "Support",
                settings: {
                  notifyEmail: email,
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

              await supabase.from("phone_lines").insert({
                user_id: userId,
                number: "+15005550006",
                name: "Priority cascaded line",
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
            } else {
              // admin@icancall.co
              await supabase.from("profiles").insert({
                id: userId,
                email,
                name: "Alex Delgado",
                preferred_name: "Alex",
                settings: {
                  role: "admin",
                  notifyEmail: email,
                  plan: "pro",
                }
              });
            }
          }
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

      const role = email === "admin@icancall.co" ? "admin" : "user";
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      const sessionToken = await signSession({ email, role, expiresAt, userId: userId || undefined });

      const response = NextResponse.json({ success: true, role });

      // Set secure HTTP-only cookie (SameSite=None is required for iframe preview sandboxes)
      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
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
