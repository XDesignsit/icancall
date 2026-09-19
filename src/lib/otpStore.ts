import crypto from "crypto";
import { supabase } from "@/lib/supabase";

// One-time PIN codes for the signup wizard, kept in public.verification_codes
// so that any serverless instance can verify a code another instance sent.
// Only a keyed hash of the code is stored.

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const TABLE = "verification_codes";

export type OtpCheck =
  | { ok: true }
  | { ok: false; status: 400 | 429; error: string };

interface Entry { codeHash: string; attempts: number; expiresAt: number }

// Used only if the table is unreachable (e.g. a deploy that lands before its
// migration): verification keeps working as it did before, per instance.
const memoryFallback = new Map<string, Entry>();

function hashCode(id: string, code: string): string {
  const secret = process.env.JWT_SECRET || "icancall_dev_only_insecure_secret";
  return crypto.createHmac("sha256", secret).update(`${id}:${code}`).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Stores a fresh code for this id, replacing any earlier one and its attempt count. */
export async function saveOtp(id: string, code: string): Promise<void> {
  const entry: Entry = { codeHash: hashCode(id, code), attempts: 0, expiresAt: Date.now() + OTP_TTL_MS };
  const { error } = await supabase.from(TABLE).upsert({
    id,
    code_hash: entry.codeHash,
    attempts: 0,
    expires_at: new Date(entry.expiresAt).toISOString(),
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.error(`otpStore: could not write ${TABLE}, falling back to this instance's memory:`, error.message);
    memoryFallback.set(id, entry);
  } else {
    memoryFallback.delete(id);
  }
}

/** Checks a code, counting the attempt. A correct code is consumed. */
export async function checkOtp(id: string, code: string): Promise<OtpCheck> {
  const { data: row, error } = await supabase
    .from(TABLE)
    .select("code_hash, attempts, expires_at")
    .eq("id", id)
    .maybeSingle();

  const fromDb = !error && !!row;
  const entry: Entry | undefined = fromDb
    ? { codeHash: row.code_hash, attempts: row.attempts, expiresAt: new Date(row.expires_at).getTime() }
    : memoryFallback.get(id);
  if (error) console.error(`otpStore: could not read ${TABLE}:`, error.message);

  const forget = async () => {
    memoryFallback.delete(id);
    if (fromDb) await supabase.from(TABLE).delete().eq("id", id);
  };

  if (!entry) return { ok: false, status: 400, error: "No code was sent. Please request a new one." };

  if (Date.now() > entry.expiresAt) {
    await forget();
    return { ok: false, status: 400, error: "Code has expired. Please request a new one." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    await forget();
    return { ok: false, status: 429, error: "Too many attempts. Please request a new code." };
  }

  // Count the attempt before looking at the code. The update only lands if
  // nobody else counted one in the meantime, so parallel guesses cannot share
  // a single attempt.
  const attempts = entry.attempts + 1;
  if (fromDb) {
    const { data: counted, error: countError } = await supabase
      .from(TABLE)
      .update({ attempts })
      .eq("id", id)
      .eq("attempts", entry.attempts)
      .select("id");
    if (countError || !counted || counted.length === 0) {
      return { ok: false, status: 400, error: "Please try that code again." };
    }
  } else {
    entry.attempts = attempts;
  }

  if (!sameHash(hashCode(id, code), entry.codeHash)) {
    const remaining = MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      await forget();
      return { ok: false, status: 429, error: "Too many attempts. Please request a new code." };
    }
    return { ok: false, status: 400, error: `Incorrect code. ${remaining} attempts remaining.` };
  }

  await forget();
  return { ok: true };
}
