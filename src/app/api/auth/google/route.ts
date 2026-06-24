import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`;
  
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
