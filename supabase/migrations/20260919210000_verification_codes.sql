-- One-time PIN codes for the signup wizard's email and phone verification.
--
-- They used to live in a Map inside each API route. On Vercel every serverless
-- instance has its own memory, so a code sent by one instance was unknown to
-- the instance that handled "verify" — verification failed at random, and the
-- attempt limit was per instance rather than per code.
--
-- id is "email:<address>" or "phone:<e164>"; only a keyed hash of the code is
-- stored. Rows are written only by the service role.

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id         TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_codes_expires_at_idx ON public.verification_codes (expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
