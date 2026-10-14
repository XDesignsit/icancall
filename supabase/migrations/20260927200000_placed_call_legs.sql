-- Caregiver legs placed for a caller's room that may still need stopping.
--
-- All Ring (simultaneous mode) rings every contact at once. When the first
-- person accepts, the other phones must stop ringing, and when the caller hangs
-- up, every phone still ringing for them must stop too. Twilio cannot list the
-- legs of a room: a leg that is ringing, or answered but still at agent-join's
-- "Press 1 to accept" prompt, is not in the conference yet. So the voice webhook
-- records each leg it places here. Rows are written only by the service role.

CREATE TABLE IF NOT EXISTS public.placed_call_legs (
  call_sid  TEXT PRIMARY KEY,
  room      TEXT NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS placed_call_legs_room_idx ON public.placed_call_legs (room);

ALTER TABLE public.placed_call_legs ENABLE ROW LEVEL SECURITY;

-- agent-join now asks which leg of a room accepted first.
CREATE INDEX IF NOT EXISTS accepted_call_legs_room_idx ON public.accepted_call_legs (room, accepted_at);
