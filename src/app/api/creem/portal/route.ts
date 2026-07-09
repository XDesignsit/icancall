import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const CREEM_API = process.env.CREEM_API_KEY?.startsWith("creem_test_")
  ? "https://test-api.creem.io/v1"
  : "https://api.creem.io/v1";

export async function POST(_req: NextRequest) {
  // Verify the logged-in user
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifySession(sessionToken);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up their Creem customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", payload.userId)
    .single();

  const customerId = profile?.settings?.creem_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found. Please complete a purchase first." }, { status: 404 });
  }

  // Request a Creem billing portal session
  const res = await fetch(`${CREEM_API}/customers/${customerId}/billing-portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CREEM_API_KEY!,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Creem portal error:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ portalUrl: data.url ?? data.portal_url });
}
