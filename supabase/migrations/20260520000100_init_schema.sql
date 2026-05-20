-- Initial schema for Application Tracker

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'no_answer' CHECK (
    status IN (
      'wishlist', 'no_answer', 'withdrew', 'rejected',
      'interviews', 'no_offer',
      'offer', 'accepted', 'declined'
    )
  ),
  applied_on DATE,
  notes TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Application status events table
CREATE TABLE IF NOT EXISTS public.application_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status TEXT CHECK (
    from_status IS NULL OR from_status IN (
      'wishlist', 'no_answer', 'withdrew', 'rejected',
      'interviews', 'no_offer',
      'offer', 'accepted', 'declined'
    )
  ),
  to_status TEXT NOT NULL CHECK (
    to_status IN (
      'wishlist', 'no_answer', 'withdrew', 'rejected',
      'interviews', 'no_offer',
      'offer', 'accepted', 'declined'
    )
  ),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_updated
  ON public.applications(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_events_user_changed
  ON public.application_status_events(user_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_events_transitions
  ON public.application_status_events(from_status, to_status);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_status_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- RLS Policies for applications
DROP POLICY IF EXISTS "Users can read their own applications" ON public.applications;
CREATE POLICY "Users can read their own applications"
  ON public.applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
CREATE POLICY "Users can create their own applications"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Users can update their own applications"
  ON public.applications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;
CREATE POLICY "Users can delete their own applications"
  ON public.applications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for application_status_events
DROP POLICY IF EXISTS "Users can read their own status events" ON public.application_status_events;
CREATE POLICY "Users can read their own status events"
  ON public.application_status_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own status events" ON public.application_status_events;
CREATE POLICY "Users can create their own status events"
  ON public.application_status_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
