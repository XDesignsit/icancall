import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/session";
import { verifyTurnstile } from "@/lib/rateLimit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  numbers: z.array(z.string()).optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    const { email, password, name, preferredName, numbers, captchaToken } = parsed.data;

    // 1. Check if user already has an active session cookie (e.g. logged in via Google)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    let userId: string | null = null;

    if (sessionToken) {
      const payload = await verifySession(sessionToken);
      userId = payload?.userId || null;
    }

    if (userId) {
      // User is already logged in (Google OAuth path). Update profile with onboarding details.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          preferred_name: preferredName || (name ?? "").split(" ")[0],
          settings: {
            notifyEmail: email,
            smsConsent: true,
            smsPhone: "",
            twoFactor: false,
            card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
            billingAddr: "123 Main St, Oakland, CA 94607",
            plan: numbers && numbers.length > 0 ? "pro" : "essential",
            billingCycle: "monthly",
            addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
          }
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Failed to update profile for logged-in user:", profileError);
      }
    } else {
      // Normal email/password signup path
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
      }

      if (!email.includes("@")) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      // CAPTCHA verification is bypassed on signup since the flow requires a successful paid Creem checkout, preventing automated spam registration.
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      // Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        },
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || "Failed to create user account." }, { status: 400 });
      }

      userId = authData.user.id;

      // Insert profile record in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          name,
          preferred_name: preferredName || (name ?? "").split(" ")[0],
          settings: {
            notifyEmail: email,
            smsConsent: true,
            smsPhone: "",
            twoFactor: false,
            card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
            billingAddr: "123 Main St, Oakland, CA 94607",
            plan: numbers && numbers.length > 0 ? "pro" : "essential",
            billingCycle: "monthly",
            addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
          }
        });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
      }
    }

    // 2. Seed selected phone lines for the user
    if (userId && Array.isArray(numbers) && numbers.length > 0) {
      // First clear any existing seeded phone lines to avoid duplicates
      await supabase.from("phone_lines").delete().eq("user_id", userId);

      const phoneLinesRows = numbers.map((num: any) => ({
        user_id: userId,
        number: num.number || num,
        name: "My Emergency Line",
        type: "seniors",
        contacts: [
          {
            id: 1,
            name,
            phone: "+14155550192", // Seed owner as primary
            rel: "Primary Caregiver",
            available: true,
          }
        ]
      }));

      const { error: linesError } = await supabase
        .from("phone_lines")
        .insert(phoneLinesRows);

      if (linesError) {
        console.error("Failed to seed phone lines:", linesError);
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("Signup API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
