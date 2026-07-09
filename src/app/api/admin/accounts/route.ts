import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return false;
  const payload = await verifySession(sessionToken);
  return payload?.role === "admin" || payload?.email === "admin@icancall.co";
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*");

    if (profileError) {
      console.error("Failed to fetch admin profiles:", profileError);
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    // 2. Fetch all phone lines
    const { data: lines, error: lineError } = await supabase
      .from("phone_lines")
      .select("*");

    if (lineError) {
      console.error("Failed to fetch admin lines:", lineError);
      return NextResponse.json({ error: "Failed to fetch phone lines" }, { status: 500 });
    }

    // 3. Map into the ACCOUNTS frontend format
    const formattedAccounts = (profiles || []).map((p) => {
      const settings = p.settings || {};
      const userLines = (lines || []).filter((l) => l.user_id === p.id);
      
      const mappedLines = userLines.map((row) => {
        const s = row.settings || {};
        return {
          label: row.name,
          person: row.type,
          number: row.number,
          mode: s.mode || "menu",
          minutesUsed: s.minutesUsed || 0,
          contacts: (row.contacts || []).length,
        };
      });

      const totalCalls30 = userLines.reduce((acc: number) => {
        return acc + 10; 
      }, 0);

      const totalMinutesUsed = userLines.reduce((acc: number, current) => {
        const s = current.settings || {};
        return acc + (s.minutesUsed || 0);
      }, 0);

      return {
        id: p.id,
        owner: p.name || "Caregiver",
        email: p.email,
        color: "oklch(0.55 0.13 285)",
        plan: settings.plan || "pro",
        billing: settings.billingCycle || "monthly",
        status: "active", 
        joined: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        last: "Active",
        city: settings.billingAddr ? settings.billingAddr.split(",")[1]?.trim() || "San Francisco" : "San Francisco",
        area: "415",
        numbers: userLines.length,
        contacts: userLines.reduce((acc: number, l) => acc + (l.contacts || []).length, 0),
        calls30: totalCalls30 || 5,
        connect: 95.0,
        vmRate: 5.0,
        minutesUsed: totalMinutesUsed || 0,
        minutesCap: (settings.plan === "essential" ? 60 : 120) * userLines.length,
        mrr: settings.plan === "essential" ? (settings.billingCycle === "yearly" ? 9.99 : 14.99) : (settings.billingCycle === "yearly" ? 19.99 : 24.99),
        ltv: 150,
        next: "N/A",
        lines: mappedLines,
      };
    });

    return NextResponse.json({ success: true, accounts: formattedAccounts });
  } catch (err) {
    console.error("Admin accounts route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
