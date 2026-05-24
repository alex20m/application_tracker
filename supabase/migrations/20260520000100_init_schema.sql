-- Initial schema for Application Tracker

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company    TEXT NOT NULL,
  role       TEXT NOT NULL,
  location   TEXT NOT NULL,
  source     TEXT,
  status     TEXT NOT NULL DEFAULT 'no_answer' CHECK (status IN (
               'wishlist', 'no_answer', 'cancelled', 'withdrew', 'rejected',
               'interviews', 'no_offer', 'offer', 'accepted', 'declined'
             )),
  applied_on DATE,
  notes      TEXT,
  events     JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_user_updated ON public.applications(user_id, updated_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

CREATE POLICY "Users can read their own applications"   ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications" ON public.applications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own applications" ON public.applications FOR DELETE USING (auth.uid() = user_id);
