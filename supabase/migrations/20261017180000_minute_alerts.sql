-- Low-minute and out-of-minutes alerts: the owner is emailed (and texted, with
-- SMS consent) once when 85% of the cycle's voice minutes are used and once
-- when they run out (src/lib/minuteAlerts.ts).
--
-- Each alert is sent at most once per minutes cycle. The marker that records
-- it, profiles.settings.addons.lowMinAlertedAt / outMinAlertedAt, is claimed
-- here in one conditional update, so two calls ending at once cannot both
-- send it, and the app never read-modify-writes settings to set it. The cycle
-- reset (resetMinutesPool) and a minute top-up (creditAddonPurchase) clear it.

-- Sets the marker and returns TRUE when this call claimed the alert; FALSE
-- when it was already sent this cycle or usedMin is below p_min_used (the
-- threshold in minutes, checked again here so a cycle reset that lands
-- between the charge and the claim cannot be marked with stale usage).
-- Claiming the out-of-minutes alert also marks the low one, so a call that
-- jumps straight past both sends only the out-of-minutes alert.
CREATE OR REPLACE FUNCTION public.claim_minute_alert(p_user_id UUID, p_marker TEXT, p_min_used NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_now     JSONB := to_jsonb(now());
  v_claimed BOOLEAN;
BEGIN
  IF p_marker NOT IN ('lowMinAlertedAt', 'outMinAlertedAt') THEN
    RAISE EXCEPTION 'unknown minute alert marker: %', p_marker;
  END IF;

  UPDATE profiles p
     SET settings = jsonb_set(
           CASE WHEN jsonb_typeof(p.settings) = 'object' THEN p.settings ELSE '{}'::jsonb END,
           '{addons}',
           (CASE WHEN jsonb_typeof(p.settings->'addons') = 'object' THEN p.settings->'addons' ELSE '{}'::jsonb END)
             || CASE WHEN p_marker = 'outMinAlertedAt'
                     THEN jsonb_build_object('lowMinAlertedAt', COALESCE(p.settings->'addons'->'lowMinAlertedAt', v_now))
                     ELSE '{}'::jsonb END
             || jsonb_build_object(p_marker, v_now)
         )
   WHERE p.id = p_user_id
     AND p.settings->'addons'->>p_marker IS NULL
     AND COALESCE((p.settings->'addons'->>'usedMin')::NUMERIC, 0) >= p_min_used
  RETURNING TRUE INTO v_claimed;

  RETURN COALESCE(v_claimed, FALSE);
END;
$$;

-- Only the server (service role) sends minute alerts.
REVOKE ALL ON FUNCTION public.claim_minute_alert(UUID, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_minute_alert(UUID, TEXT, NUMERIC) TO service_role;
