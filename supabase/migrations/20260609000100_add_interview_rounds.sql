ALTER TABLE public.applications
  ADD COLUMN interview_rounds JSONB NOT NULL DEFAULT '[]'::jsonb;
