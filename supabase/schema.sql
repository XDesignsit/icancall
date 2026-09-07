-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    preferred_name TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Phone Lines table
CREATE TABLE IF NOT EXISTS public.phone_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    number TEXT UNIQUE NOT NULL,
    name TEXT,
    type TEXT,
    contacts JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_lines ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely (drop if exist)
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to manage their own phone lines" ON public.phone_lines;
CREATE POLICY "Allow users to manage their own phone lines" ON public.phone_lines
    FOR ALL USING (auth.uid() = user_id);

-- Signed-in devices; see supabase/migrations/20260907120000_user_sessions.sql.
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
