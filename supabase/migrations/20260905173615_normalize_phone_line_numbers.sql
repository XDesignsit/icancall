-- Normalise phone_lines.number to E.164.
--
-- Inbound-call routing matches the dialed number the gateway sends, which is
-- always E.164 (+17876401746). Rows written before src/lib/phone.ts existed
-- could hold display form -- "(787) 640-1746" -- and those lines can never be
-- matched, so calls to them are dropped silently.
--
-- number is UNIQUE, so a rewrite could collide (both "(555) 123-4567" and
-- "+15551234567" present). Abort loudly in that case rather than half-applying;
-- a human has to decide which row survives.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.to_e164(raw TEXT) RETURNS TEXT AS $$
DECLARE
  digits TEXT;
BEGIN
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN raw;
  END IF;

  IF btrim(raw) LIKE '+%' THEN
    RETURN '+' || regexp_replace(substring(btrim(raw) FROM 2), '\D', '', 'g');
  END IF;

  digits := regexp_replace(raw, '\D', '', 'g');
  IF digits = '' THEN
    RETURN raw;
  END IF;
  IF length(digits) = 10 THEN
    RETURN '+1' || digits;                       -- NANP, no country code
  END IF;
  IF length(digits) = 11 AND left(digits, 1) = '1' THEN
    RETURN '+' || digits;
  END IF;
  RETURN '+' || digits;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
DECLARE
  collisions INT;
  detail TEXT;
BEGIN
  SELECT count(*), string_agg(DISTINCT normalised, ', ')
    INTO collisions, detail
  FROM (
    SELECT pg_temp.to_e164(number) AS normalised
    FROM public.phone_lines
    WHERE number IS NOT NULL
    GROUP BY 1
    HAVING count(*) > 1
  ) dupes;

  IF collisions > 0 THEN
    RAISE EXCEPTION
      'Normalising would collide on % number(s): %. Resolve the duplicate phone_lines rows first.',
      collisions, detail;
  END IF;
END $$;

UPDATE public.phone_lines
   SET number = pg_temp.to_e164(number),
       updated_at = NOW()
 WHERE number IS NOT NULL
   AND number IS DISTINCT FROM pg_temp.to_e164(number);

COMMIT;
