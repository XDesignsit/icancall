import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password, name, preferredName, numbers } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create user account." }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert profile record in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        name,
        preferred_name: preferredName || name.split(" ")[0],
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

    // 3. Seed selected phone lines
    if (Array.isArray(numbers) && numbers.length > 0) {
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
