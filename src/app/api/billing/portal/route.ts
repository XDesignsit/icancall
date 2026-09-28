import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { isSimulatedBilling, stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
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
  if (isSimulatedBilling(payload.email)) {
    return NextResponse.json({ error: "Billing is simulated in this environment, so there is no billing portal." }, { status: 404 });
  }

  // Look up their Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", payload.userId)
    .single();

  const customerId = profile?.settings?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found. Please complete a purchase first." }, { status: 404 });
  }

  // Request a Stripe billing portal session
  try {
    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${proto}://${host}/dashboard?view=account`,
    });
    return NextResponse.json({ portalUrl: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 502 });
  }
}
