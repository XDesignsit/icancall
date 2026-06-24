import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const redirectTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent(next)}`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.json({ error: "Failed to initiate Google login" }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}
