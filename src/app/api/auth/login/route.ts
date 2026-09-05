import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { demoAccount, ensureDemoAccount } from "@/lib/demoAccounts";
import { resolveSessionRole } from "@/lib/roles";

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
    // Demo logins bypass Supabase password auth: the login page submits a
    // placeholder password, so match on the sentinel values it sends. The
    // Google-flow sentinel is not accepted for the admin demo.
    const demo = demoAccount(email);
    const isDemo = !!demo && (password === "••••••••" || (demo.role !== "admin" && password === "google_oauth_bypass"));

    // 1. Bulletproof Auth bypass for Demo accounts using Service Role Admin API
    if (isDemo) {
      try {
        userId = await ensureDemoAccount(email);
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

    const role = await resolveSessionRole(userId, email);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const token = await signSession({ email, role, expiresAt, userId: userId || undefined });

    const response = NextResponse.json({ success: true, role });

    // Set secure HTTP-only cookie (SameSite=None is required for iframe preview sandboxes in prod)
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
