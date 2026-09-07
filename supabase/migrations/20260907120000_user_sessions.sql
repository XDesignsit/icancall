-- One row per signed-in device, so the dashboard's "Active sessions" panel
-- can list what is really signed in (it used to show three invented devices)
-- and "Sign out" can revoke a device for real.
--
-- The app's session cookie is its own JWT, not a Supabase session, so nothing
-- tracked devices before. Each cookie now carries the id of its row here; a
-- deleted row means a revoked session, which /api/caregiver/profile enforces
-- when the dashboard loads. Rows are written only by the service role.

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  device       TEXT NOT NULL DEFAULT '',
  user_agent   TEXT NOT NULL DEFAULT '',
  ip           TEXT NOT NULL DEFAULT '',
  city         TEXT NOT NULL DEFAULT '',
  region       TEXT NOT NULL DEFAULT '',
  country      TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions (user_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
