import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/session";
import { verifyTurnstile } from "@/lib/rateLimit";
import { toE164 } from "@/lib/phone";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  // The wizard posts full number objects ({ id, number, area, memorable }); plain strings also accepted
  numbers: z.array(z.union([z.string(), z.looseObject({ number: z.string() })])).optional(),
  captchaToken: z.string().optional(),
  smsConsent: z.boolean().optional(),
  plan: z.enum(["essential", "pro"]).optional(),
  billing: z.enum(["monthly", "yearly"]).optional(),
});

// Mirrors the wizard's PLANS config for the confirmation email summary
const PLAN_DETAILS = {
  essential: { name: "Essential Plan", lines: "1 Virtual Line", monthly: "$14.99", yearly: "$149" },
  pro: { name: "Pro Plan", lines: "2 Virtual Lines", monthly: "$24.99", yearly: "$249" },
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    const { email, password, name, preferredName, numbers, captchaToken, billing } = parsed.data;
    const smsConsent = parsed.data.smsConsent === true;
    const smsPhone: string = (body.smsPhone || "").replace(/\D/g, "");
    // Only retain the phone number when the user actually opted in to SMS
    const rawNormalized = smsPhone.length === 10 ? `+1${smsPhone}` : smsPhone.length === 11 ? `+${smsPhone}` : "";
    const normalizedSmsPhone = smsConsent ? rawNormalized : "";
    const plan = parsed.data.plan || (numbers && numbers.length > 0 ? "pro" : "essential");
    const billingCycle = billing || "monthly";

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
            smsConsent,
            smsPhone: normalizedSmsPhone,
            twoFactor: false,
            card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
            billingAddr: "123 Main St, Oakland, CA 94607",
            plan,
            billingCycle,
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

      // Sign up the user in Supabase Auth. Pass emailRedirectTo explicitly so the
      // confirmation link points at the deployment's real host instead of falling
      // back to the Supabase project's Site URL (which was set to localhost).
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
          emailRedirectTo: `${appUrl}/dashboard`,
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
            smsConsent,
            smsPhone: normalizedSmsPhone,
            twoFactor: false,
            card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
            billingAddr: "123 Main St, Oakland, CA 94607",
            plan,
            billingCycle,
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

      const phoneLinesRows = numbers.map((num) => ({
        user_id: userId,
        number: toE164(typeof num === "string" ? num : num.number),
        name: "My Priority Line",
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

    // 3. Send signup confirmations. Failures here must never fail the signup itself.
    if (userId) {
      const details = PLAN_DETAILS[plan];
      const firstName = preferredName || (name ?? "").split(" ")[0] || "there";

      // Import the paid customer into the Acumbamail Subscribers list. The
      // welcome email is sent by Acumbamail's list autoresponder (welcome_email),
      // so we intentionally do not also send an SMTP welcome here.
      try {
        const { addAcumbamailSubscriber } = await import("@/lib/acumbamail");
        await addAcumbamailSubscriber({
          listId: process.env.ACUMBAMAIL_SUBSCRIBERS_LIST_ID,
          email,
          mergeFields: { name: name || firstName },
          welcomeEmail: true,
        });
      } catch (acumbaErr) {
        console.error("Failed to import subscriber to Acumbamail:", acumbaErr);
      }

      if (smsConsent && normalizedSmsPhone) {
        try {
          const { sendSms } = await import("@/lib/twilio");
          await sendSms(
            normalizedSmsPhone,
            `Welcome to iCanCall, ${firstName}! Your ${details.name} is active. Manage your lines and trusted contacts at https://app.icancall.co/dashboard — Reply STOP to opt out.`
          );
        } catch (smsErr) {
          console.error("Failed to send signup confirmation SMS:", smsErr);
        }
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("Signup API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
