/**
 * Canonical phone-number formatting.
 *
 * Every number that reaches the database must be stored in E.164 (+15551234567)
 * because inbound-call lookups match the dialed number Twilio/Telnyx sends us,
 * and those gateways always send E.164. Numbers picked from the number-picker UI
 * or typed by a caregiver arrive in display form — "(787) 640-1746" — so they
 * have to be normalised on the way in, not just on the way out.
 */
export function toE164(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();

  // Already E.164, or an international number typed with a leading +.
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`; // NANP without country code
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** Display form for NANP numbers: +15551234567 -> (555) 123-4567. */
export function toDisplay(raw: string | null | undefined): string {
  const e164 = toE164(raw);
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}
