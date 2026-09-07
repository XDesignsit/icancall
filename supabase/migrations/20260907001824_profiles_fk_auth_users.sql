-- Tie public.profiles to the auth user it describes.
--
-- profiles.id was a bare UUID primary key with nothing pointing at auth.users,
-- so deleting an auth user left its profile behind. That is how production
-- accumulated 6 profiles against 12 auth users, and it bit again while testing
-- provisioning: removing the auth user left the profile row untouched.
--
-- phone_lines already cascades from profiles, so one delete in auth.users now
-- removes the whole chain.

DO $$
DECLARE
  orphans INT;
BEGIN
  SELECT count(*) INTO orphans
    FROM public.profiles p
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

  IF orphans > 0 THEN
    RAISE EXCEPTION
      'Cannot add the foreign key: % profile row(s) have no matching auth user. Remove or re-home them first.',
      orphans;
  END IF;
END $$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
