-- Voice-minute metering: each call is charged against its account's minute
-- pool (profiles.settings.addons.usedMin) exactly once, when it ends.
--
-- metered_minutes records the charge and doubles as the guard: a call with a
-- value has been charged, so a retried webhook, or a second webhook reporting
-- on the same call (a <Dial action> and the number's call-status webhook both
-- do for a menu-mode call), charges nothing. Claiming the call and adding to
-- usedMin happen in one transaction, and the add is done in
-- SQL rather than read-modify-written from the app, so two calls ending at
-- once cannot lose one of their charges.

ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS metered_minutes INTEGER;

-- Returns the account's new usedMin, or NULL when nothing was charged (the
-- call was already metered, or is not in the call log).
CREATE OR REPLACE FUNCTION public.charge_call_minutes(p_call_sid TEXT, p_minutes INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_minutes INTEGER := GREATEST(COALESCE(p_minutes, 0), 0);
  v_user    UUID;
  v_used    NUMERIC;
BEGIN
  UPDATE calls c
     SET metered_minutes = v_minutes
    FROM phone_lines l
   WHERE c.call_sid = p_call_sid
     AND c.metered_minutes IS NULL
     AND l.id = c.line_id
  RETURNING l.user_id INTO v_user;

  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE profiles p
     SET settings = jsonb_set(
           CASE WHEN jsonb_typeof(p.settings) = 'object' THEN p.settings ELSE '{}'::jsonb END,
           '{addons}',
           (CASE WHEN jsonb_typeof(p.settings->'addons') = 'object' THEN p.settings->'addons' ELSE '{}'::jsonb END)
             || jsonb_build_object('usedMin', COALESCE((p.settings->'addons'->>'usedMin')::NUMERIC, 0) + v_minutes)
         )
   WHERE p.id = v_user
  RETURNING (p.settings->'addons'->>'usedMin')::NUMERIC INTO v_used;

  RETURN v_used;
END;
$$;

-- Only the server (service role) meters calls.
REVOKE ALL ON FUNCTION public.charge_call_minutes(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_call_minutes(TEXT, INTEGER) TO service_role;
