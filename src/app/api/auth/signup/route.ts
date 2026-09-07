import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { issueSession, sessionCookieOptions, verifySession } from "@/lib/session";
import { toE164 } from "@/lib/phone";
import { resolveSessionRole } from "@/lib/roles";
import { isOnboarded } from "@/lib/onboarding";
import { provisionNumber } from "@/lib/numbers";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  // The wizard posts full number objects ({ id, number, area, memorable }); plain strings also accepted
  numbers: z.array(z.union([z.string(), z.looseObject({ number: z.string() })])).optional(),
  captchaToken: z.string().optional(),
  smsConsent: z.boolean().optional(),
  plan: z.enum(["essential", "pro", "careteam"]).optional(),
  billing: z.enum(["monthly", "yearly"]).optional(),
});

// Mirrors the wizard's PLANS config for the confirmation email summary
const PLAN_DETAILS = {
  essential: { name: "Essential Plan", lines: "1 Virtual Line", monthly: "$14.99", yearly: "$149" },
  pro: { name: "Pro Plan", lines: "2 Virtual Lines", monthly: "$24.99", yearly: "$249" },
  careteam: { name: "Care Team Plan", lines: "5 Virtual Lines", monthly: "$49.99", yearly: "$499" },
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
    let sessionEmail: string | null = null;

    if (sessionToken) {
      const payload = await verifySession(sessionToken);
      userId = payload?.userId || null;
      sessionEmail = payload?.email || null;
    }

    if (userId) {
      // Already authenticated (Google, or a PIN login that landed on an
      // unfinished account) and now completing the wizard. Merge onto the
      // existing settings: the Creem webhook may already have written the
      // customer/subscription ids for this checkout, and a plain replace
      // would wipe them.
      const { data: existing } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", userId)
        .maybeSingle();
      const existingSettings = (existing?.settings || {}) as Record<string, unknown>;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: sessionEmail || email,
          name,
          preferred_name: preferredName || (name ?? "").split(" ")[0],
          settings: {
            ...existingSettings,
            notifyEmail: email,
            smsConsent,
            smsPhone: normalizedSmsPhone,
            twoFactor: false,
            plan,
            billingCycle,
            addons: existingSettings.addons || { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
          }
        });

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

      // CAPTCHA is deliberately not required here: signup completes only after a
      // paid Creem checkout, which is already bot-proof, so a challenge would add
      // friction without adding protection.

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
            plan,
            billingCycle,
            addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
          }
        });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
      }
    }

    // 2. Buy the selected numbers from the carrier and attach them as lines.
    //    A number whose purchase fails is left out rather than saved dead:
    //    the dashboard's empty state lets the customer pick another one,
    //    which is free within the plan's quota.
    if (userId && Array.isArray(numbers) && numbers.length > 0) {
      // First clear any existing seeded phone lines to avoid duplicates
      await supabase.from("phone_lines").delete().eq("user_id", userId);

      const phoneLinesRows = [];
      for (const num of numbers) {
        const e164 = toE164(typeof num === "string" ? num : num.number);
        const outcome = await provisionNumber(e164, email);
        if (!outcome.ok) {
          console.error(`Signup for ${email}: number ${e164} not attached, purchase failed: ${outcome.error}`);
          continue;
        }
        phoneLinesRows.push({
          user_id: userId,
          number: e164,
          name: "My Priority Line",
          type: "seniors",
          contacts: [
            {
              id: 1,
              name,
              phone: rawNormalized, // the caregiver's own phone, regardless of SMS consent
              rel: "Primary Caregiver",
              available: true,
            }
          ],
          settings: { telephony: outcome.record },
        });
      }

      if (phoneLinesRows.length > 0) {
        const { error: linesError } = await supabase
          .from("phone_lines")
          .insert(phoneLinesRows);

        if (linesError) {
          console.error("Failed to seed phone lines:", linesError);
        }
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

    const response = NextResponse.json({ success: true, userId });

    // A session that started as onboarding-only (Google callback / PIN login on
    // an unfinished account) is re-issued without the flag once the account
    // is complete, so the wizard's "Go to dashboard" link is let through.
    if (userId && sessionToken) {
      const role = await resolveSessionRole(userId, email);
      const onboarded = await isOnboarded(userId, email);
      const fresh = await issueSession({ email, role, userId, onboarding: !onboarded });
      response.cookies.set("session", fresh, sessionCookieOptions());
    }

    return response;
  } catch (err) {
    console.error("Signup API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
