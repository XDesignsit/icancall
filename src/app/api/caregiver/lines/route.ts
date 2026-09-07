import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { invalidateCachedAccount } from "@/lib/db";
import { resolveAccount } from "@/lib/account";
import { toE164 } from "@/lib/phone";
import { provisionNumber, releaseProvisionedNumber, type TelephonyRecord } from "@/lib/numbers";

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
    const lines = fetchedLines || [];

    if (error) {
      console.error("Failed to fetch phone lines:", error);
      return NextResponse.json({ error: "Failed to fetch lines" }, { status: 500 });
    }

    // An account with no lines gets an empty list. This used to seed a
    // "Priority cascaded line" for Maria Delgado on Twilio's magic test number,
    // which showed every new customer someone else's sample data -- and, since
    // phone_lines.number is unique, failed outright for the second account.

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

    // 0. What the account holds today, so we can tell new numbers (to buy)
    //    from removed ones (to release) and keep each line's carrier record.
    const { data: existingRows } = await supabase
      .from("phone_lines")
      .select("number, settings")
      .eq("user_id", userId);
    const existingByNumber = new Map<string, TelephonyRecord | undefined>(
      (existingRows || []).map((r) => [r.number as string, (r.settings || {}).telephony as TelephonyRecord | undefined])
    );

    // Session email, for the carrier-side friendly name and the demo check.
    const cookieStore = await cookies();
    const payload = await verifySession(cookieStore.get("session")?.value || "");
    const ownerEmail = payload?.email || "";

    // 1. Buy any number the account did not hold before. A failed purchase
    //    refuses the whole save so the client can drop that line, rather than
    //    saving a number the carrier never assigned to us.
    const failedNumbers: string[] = [];
    const telephonyByNumber = new Map<string, TelephonyRecord | undefined>();
    for (const l of lines) {
      const e164 = toE164(l.number);
      if (existingByNumber.has(e164)) {
        telephonyByNumber.set(e164, existingByNumber.get(e164));
        continue;
      }
      const outcome = await provisionNumber(e164, ownerEmail);
      if (outcome.ok) {
        telephonyByNumber.set(e164, outcome.record);
      } else {
        failedNumbers.push(e164);
      }
    }
    if (failedNumbers.length > 0) {
      return NextResponse.json(
        { error: "We couldn't reserve that number with the carrier. Please pick another.", failedNumbers },
        { status: 502 }
      );
    }

    // 2. Map to database rows. No `id` column: PostgREST bulk upserts require
    //    identical keys on every row, and new lines from the UI carry
    //    client-generated non-UUID ids anyway — the unique `number` column is
    //    the conflict target, so existing rows keep their ids.
    const rows = lines.map((l) => {
      const e164 = toE164(l.number);
      return {
        user_id: userId,
        number: e164,
        name: l.label, // label on frontend
        type: l.person, // person/role on frontend
        contacts: l.contacts || [],
        settings: {
          color: l.color,
          mode: l.mode,
          minutesUsed: l.minutesUsed,
          schedule: l.schedule || [],
          extraSettings: l.settings || {},
          telephony: telephonyByNumber.get(e164),
        }
      };
    });

    // 3. Upsert the lines
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

    // 4. Delete any lines that were removed from the UI, and give their
    //    numbers back to the carrier so they stop billing.
    // (PostgREST `in` lists take bare/double-quoted values; single quotes fail on uuid columns)
    const keptNumbers = new Set(rows.map((r) => r.number));
    for (const [number, record] of existingByNumber) {
      if (!keptNumbers.has(number)) {
        await releaseProvisionedNumber(number, record);
        invalidateCachedAccount(number);
      }
    }
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
