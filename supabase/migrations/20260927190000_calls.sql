-- One row per call to an iCanCall line, for the dashboard's call log and the
-- caregiver's call alerts.
--
-- The voice webhook creates the row when the call comes in ("ringing"); the
-- caregiver bridge marks who accepted it ("connected"); the voicemail recorder
-- marks a message ("voicemail"); and the number's call-status webhook closes
-- it when the caller hangs up, turning a call nobody took into "missed".
-- alerted_at makes the caregiver's text/email go out once per call, however
-- many webhooks report on it. Rows are written only by the service role.

CREATE TABLE IF NOT EXISTS public.calls (
  call_sid           TEXT PRIMARY KEY,  -- the caller's inbound CallSid
  line_id            UUID NOT NULL REFERENCES public.phone_lines(id) ON DELETE CASCADE,
  from_number        TEXT,
  status             TEXT NOT NULL DEFAULT 'ringing'
                       CHECK (status IN ('ringing', 'connected', 'missed', 'voicemail')),
  answered_by        TEXT,              -- the contact who accepted, by name
  answered_rel       TEXT,
  answered_at        TIMESTAMPTZ,
  voicemail_offered_at TIMESTAMPTZ,     -- the caller reached the leave-a-message prompt
  recording_url      TEXT,
  recording_seconds  INTEGER,
  transcript         TEXT,
  duration_seconds   INTEGER,           -- the whole call, from Twilio
  talk_seconds       INTEGER,           -- from the contact accepting to the end
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at           TIMESTAMPTZ,
  alerted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS calls_line_started_idx ON public.calls (line_id, started_at DESC);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
