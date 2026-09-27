-- Caregiver legs of the call bridge that a person accepted at agent-join's
-- "Press 1 to accept" prompt.
--
-- When a caregiver leg ends, its status callback has to decide between ringing
-- the next contact (nobody took the call) and letting the caller go (the call
-- was had). Neither Twilio's CallStatus nor the conference can tell: voicemail
-- that answered ends "completed" like a conversation, and Twilio ignores a
-- status-callback URL changed mid-call. So agent-join records the acceptance
-- here and the callbacks look the leg up. Rows are written only by the
-- service role.

CREATE TABLE IF NOT EXISTS public.accepted_call_legs (
  call_sid    TEXT PRIMARY KEY,
  room        TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accepted_call_legs ENABLE ROW LEVEL SECURITY;
