import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { invalidateCachedAccount } from "@/lib/db";
import { resolveAccount } from "@/lib/account";
import { toE164 } from "@/lib/phone";

// Resolve the account whose lines this request acts on. A Care Team member
// resolves to the owner's account so both caregivers manage the same lines.
async function getAccountId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  const resolved = await resolveAccount(payload.userId);
  return resolved.accountId;
}

export async function GET() {
  try {
    const userId = await getAccountId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch phone lines from Supabase
    const { data: fetchedLines, error } = await supabase
      .from("phone_lines")
      .select("*")
      .eq("user_id", userId);
    let lines = fetchedLines;

    if (error) {
      console.error("Failed to fetch phone lines:", error);
      return NextResponse.json({ error: "Failed to fetch lines" }, { status: 500 });
    }

    // 2. If no lines exist, seed a default one
    if (!lines || lines.length === 0) {
      const defaultLine = {
        user_id: userId,
        number: "+15005550006", // Magic Twilio test number
        name: "Priority cascaded line",
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
    const userId = await getAccountId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lines } = await request.json();

    if (!Array.isArray(lines)) {
      return NextResponse.json({ error: "Lines must be an array" }, { status: 400 });
    }

    // 1. Map to database rows. No `id` column: PostgREST bulk upserts require
    //    identical keys on every row, and new lines from the UI carry
    //    client-generated non-UUID ids anyway — the unique `number` column is
    //    the conflict target, so existing rows keep their ids.
    const rows = lines.map((l) => {
      return {
        user_id: userId,
        number: toE164(l.number),
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

    // 2. Upsert the lines
    const { data: updatedLines, error: upsertError } = await supabase
      .from("phone_lines")
      .upsert(rows, { onConflict: "number" })
      .select();

    if (upsertError || !updatedLines) {
      console.error("Failed to upsert phone lines:", upsertError);
      return NextResponse.json({ error: "Failed to save phone lines" }, { status: 500 });
    }

    // Invalidate cached account details to reflect the updated settings immediately
    (updatedLines || []).forEach((l) => {
      if (l.number) {
        invalidateCachedAccount(l.number);
      }
    });

    // 3. Delete any lines that were removed from the UI
    // (PostgREST `in` lists take bare/double-quoted values; single quotes fail on uuid columns)
    const activeIds = (updatedLines || []).map((l) => l.id);
    if (activeIds.length > 0) {
      await supabase
        .from("phone_lines")
        .delete()
        .eq("user_id", userId)
        .not("id", "in", `(${activeIds.join(",")})`);
    } else {
      await supabase
        .from("phone_lines")
        .delete()
        .eq("user_id", userId);
    }

    // Map back to frontend shape
    const frontendLines = updatedLines.map((row) => {
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
