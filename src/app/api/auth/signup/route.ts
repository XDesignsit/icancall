import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAuthClient, supabase } from "@/lib/supabase";
import { EMAIL_PROOF_COOKIE, issueSession, sessionCookieOptions, verifyEmailProof, verifySession } from "@/lib/session";
import { startSession } from "@/lib/userSessions";
import { toE164 } from "@/lib/phone";
import { resolveSessionRole } from "@/lib/roles";
import { isOnboarded } from "@/lib/onboarding";
import { provisionNumber } from "@/lib/numbers";
import { planConfig } from "@/lib/planConfig";
import { activePlanForSubscription, isSimulatedBilling, verifyPlanCheckout, type VerifiedPlanPurchase } from "@/lib/creem";

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
  // The Creem checkout this signup paid for (from /api/creem/checkout).
  checkoutId: z.string().max(200).optional(),
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
    let plan = parsed.data.plan || (numbers && numbers.length > 0 ? "pro" : "essential");
    let billingCycle = billing || "monthly";

    // 1. Check if user already has an active session cookie (e.g. logged in via Google)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    let userId: string | null = null;
    let createdNewUser = false;
    let sessionEmail: string | null = null;
    let sessionId: string | undefined;

    if (sessionToken) {
      const payload = await verifySession(sessionToken);
      userId = payload?.userId || null;
      sessionEmail = payload?.email || null;
      sessionId = payload?.sid;
    }

    // 1b. Proof of payment. An account, its plan and its phone numbers (which
    // cost real money to buy) are only created for a checkout Creem confirms
    // was paid by this person. The wizard's "payment succeeded" message comes
    // from the browser and proves nothing. What was paid for — not what the
    // wizard says was chosen — decides the plan. Demo accounts and
    // environments without Creem credentials keep the simulated checkout.
    let purchase: VerifiedPlanPurchase | null = null;
    const ownerEmail = sessionEmail || email;
    if (!isSimulatedBilling(ownerEmail)) {
      if (parsed.data.checkoutId) {
        const check = await verifyPlanCheckout(parsed.data.checkoutId, { userId, email: ownerEmail });
        if (!check.ok) {
          console.error(`Signup for ${ownerEmail} refused: checkout ${parsed.data.checkoutId} ${check.reason}`);
          return check.reason === "lookup_failed"
            ? NextResponse.json({ error: "We couldn't verify your payment just now. Please try again in a moment — you won't be charged twice." }, { status: 502 })
            : NextResponse.json({ error: "We couldn't find a completed payment for this signup. Please complete checkout to continue." }, { status: 402 });
        }
        purchase = check.purchase;
      } else if (userId) {
        // Resuming an account whose checkout the Creem webhook already recorded.
        const { data: paidProfile } = await supabase.from("profiles").select("settings").eq("id", userId).maybeSingle();
        const knownSub = paidProfile?.settings?.creem_subscription_id;
        purchase = typeof knownSub === "string" && knownSub ? await activePlanForSubscription(knownSub) : null;
      }
      if (!purchase) {
        return NextResponse.json({ error: "We couldn't find a completed payment for this signup. Please complete checkout to continue." }, { status: 402 });
      }

      // One paid subscription opens one account.
      if (purchase.subscriptionId) {
        const { data: holders } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("settings->>creem_subscription_id", purchase.subscriptionId);
        const taken = (holders || []).some((h: { id: string; email: string | null }) =>
          userId ? h.id !== userId : (h.email || "").toLowerCase() !== email.toLowerCase());
        if (taken) {
          console.error(`Signup for ${ownerEmail} refused: subscription ${purchase.subscriptionId} already belongs to another account`);
          return NextResponse.json({ error: "This payment has already been used to open an account." }, { status: 409 });
        }
      }

      plan = purchase.plan;
      billingCycle = purchase.billingCycle;
    }
    const creemIds = purchase
      ? {
          ...(purchase.customerId ? { creem_customer_id: purchase.customerId } : {}),
          ...(purchase.subscriptionId ? { creem_subscription_id: purchase.subscriptionId } : {}),
        }
      : {};

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
            ...creemIds,
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
      const { data: authData, error: authError } = await createAuthClient().auth.signUp({
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

      // For an address that is already registered Supabase answers with a
      // decoy user (no identities, an id that exists nowhere) instead of an
      // error. Building a profile, buying numbers or issuing a session on that
      // id would all go wrong — send the customer to sign in instead.
      if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in to continue.", code: "account_exists" },
          { status: 409 }
        );
      }
      createdNewUser = true;

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
            ...creemIds,
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
      // Never buy more numbers than the paid plan includes, whatever was posted.
      for (const num of numbers.slice(0, planConfig(plan).includedLines)) {
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
          type: "Trusted Contact",
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
          // The list needs matching merge fields ("name", "first_name") for
          // the welcome autoresponder to greet by name; unknown keys are dropped.
          mergeFields: { name: name || firstName, first_name: firstName },
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
      // Same device, same session row: keep the sid so the account page
      // still recognises this browser as "This device".
      const fresh = await issueSession({ email, role, userId, onboarding: !onboarded, sid: sessionId });
      response.cookies.set("session", fresh, sessionCookieOptions());
    } else if (userId && createdNewUser && (await verifyEmailProof(cookieStore.get(EMAIL_PROOF_COOKIE)?.value, email))) {
      // A brand-new email/password account, created by someone the wizard's
      // PIN check proved controls this address: sign them in, so "Go to
      // dashboard" lands on the dashboard instead of the login page. Without
      // the proof (the wizard verified a phone instead, or the proof expired)
      // they sign in with an emailed PIN as before.
      const role = await resolveSessionRole(userId, email);
      const onboarded = await isOnboarded(userId, email);
      const sid = await startSession(userId, request.headers);
      const fresh = await issueSession({ email, role, userId, onboarding: !onboarded, sid });
      response.cookies.set("session", fresh, sessionCookieOptions());
    }
    // The proof is single-use.
    if (cookieStore.get(EMAIL_PROOF_COOKIE)) {
      response.cookies.set(EMAIL_PROOF_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    }

    return response;
  } catch (err) {
    console.error("Signup API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
