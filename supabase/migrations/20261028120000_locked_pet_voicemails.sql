-- Pet lines (lib/pets) never hang up on a finder: when the line is out of
-- minutes for the year, the caller still leaves a voicemail. It is kept locked
-- until the owner renews or the yearly minutes reset (no transcript, no audio
-- in the owner's alert), and iCanCall admins see it in the Super Admin console
-- so a found pet is never lost to an empty minute balance.
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS calls_locked_idx ON public.calls (locked_at DESC) WHERE locked_at IS NOT NULL;
