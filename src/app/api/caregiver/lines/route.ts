import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { invalidateCachedAccount } from "@/lib/db";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  return payload?.userId || null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch phone lines from Supabase
    let { data: lines, error } = await supabase
      .from("phone_lines")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch phone lines:", error);
      return NextResponse.json({ error: "Failed to fetch lines" }, { status: 500 });
    }

    // 2. If no lines exist, seed a default one
    if (!lines || lines.length === 0) {
      const defaultLine = {
        user_id: userId,
        number: "+15005550006", // Magic Twilio test number
        name: "Emergency cascaded line",
        type: "seniors",
        contacts: [
          {
            id: 1,
            name: "Maria Delgado",
            phone: "+14155550192",
            rel: "Primary Caregiver",
            available: true,
          }
        ]
      };

      const { data: inserted, error: insertError } = await supabase
        .from("phone_lines")
        .insert(defaultLine)
        .select();

      if (insertError) {
        console.error("Failed to seed default line:", insertError);
        return NextResponse.json({ error: "Failed to initialize phone line data" }, { status: 500 });
      }
      lines = inserted;
    }

    return NextResponse.json({ success: true, lines });
  } catch (err) {
    console.error("Caregiver Lines GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lines } = await request.json();

    if (!Array.isArray(lines)) {
      return NextResponse.json({ error: "Lines must be an array" }, { status: 400 });
    }

    // 1. Map to database rows (if ID is not a UUID, let Supabase generate one)
    const rows = lines.map((l: any) => {
      const isUuid = typeof l.id === "string" && l.id.length > 20;
      return {
        id: isUuid ? l.id : undefined,
        user_id: userId,
        number: l.number,
        name: l.label, // label on frontend
        type: l.person, // person/role on frontend
        contacts: l.contacts || [],
        settings: {
          color: l.color,
          mode: l.mode,
          minutesUsed: l.minutesUsed,
          schedule: l.schedule || [],
          extraSettings: l.settings || {},
        }
      };
    });

    console.log("ROWS TO UPSERT:", JSON.stringify(rows, null, 2));

    // 2. Upsert the lines
    const { data: updatedLines, error: upsertError } = await supabase
      .from("phone_lines")
      .upsert(rows)
      .select();

    if (upsertError || !updatedLines) {
      console.error("Failed to upsert phone lines:", upsertError);
      return NextResponse.json({ error: "Failed to save phone lines" }, { status: 500 });
    }

    // Invalidate cached account details to reflect the updated settings immediately
    (updatedLines || []).forEach((l: any) => {
      if (l.number) {
        invalidateCachedAccount(l.number);
      }
    });

    // 3. Delete any lines that were removed from the UI
    const activeIds = (updatedLines || []).map((l: any) => l.id);
    if (activeIds.length > 0) {
      await supabase
        .from("phone_lines")
        .delete()
        .eq("user_id", userId)
        .not("id", "in", `(${activeIds.map((id: any) => `'${id}'`).join(",")})`);
    } else {
      await supabase
        .from("phone_lines")
        .delete()
        .eq("user_id", userId);
    }

    // Map back to frontend shape
    const frontendLines = updatedLines.map((row: any) => {
      const s = row.settings || {};
      return {
        id: row.id,
        number: row.number,
        label: row.name,
        person: row.type,
        contacts: row.contacts || [],
        color: s.color || "oklch(0.58 0.115 232)",
        mode: s.mode || "menu",
        minutesUsed: s.minutesUsed || 0,
        schedule: s.schedule || [],
        settings: s.extraSettings || {},
      };
    });

    return NextResponse.json({ success: true, lines: frontendLines });
  } catch (err) {
    console.error("Caregiver Lines POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
