import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    let userId: string | null = null;
    const isDemoCaregiver = email === "support@icancall.co" && (password === "google_oauth_bypass" || password === "••••••••");
    const isDemoAdmin = email === "admin@icancall.co" && password === "••••••••";

    // 1. Bulletproof Auth bypass for Demo accounts using Service Role Admin API
    if (isDemoCaregiver || isDemoAdmin) {
      try {
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
          if (email === "support@icancall.co") {
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
        console.error("Admin bypass processing error:", adminErr);
        // Fallback to normal flow if admin API fails (e.g. key mismatch or network issues)
      }
    }

    // 2. Normal path for non-demo users or as fallback
    if (!userId) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
      }
      userId = authData.user.id;
    }

    const role = email === "admin@icancall.co" ? "admin" : "user";
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const token = await signSession({ email, role, expiresAt, userId: userId || undefined });

    const response = NextResponse.json({ success: true, role });

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
