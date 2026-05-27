-- Rename status value 'no_answer' to 'applied' in all existing rows and events

-- 1. Update current status column
UPDATE public.applications
SET status = 'applied'
WHERE status = 'no_answer';

-- 2. Update to_status and from_status inside the events JSONB array
UPDATE public.applications
SET events = (
  SELECT jsonb_agg(
    CASE
      WHEN event->>'to_status' = 'no_answer' THEN jsonb_set(event, '{to_status}', '"applied"')
      ELSE event
    END
  )
  FROM jsonb_array_elements(events) AS event
)
WHERE events @> '[{"to_status": "no_answer"}]';

UPDATE public.applications
SET events = (
  SELECT jsonb_agg(
    CASE
      WHEN event->>'from_status' = 'no_answer' THEN jsonb_set(event, '{from_status}', '"applied"')
      ELSE event
    END
  )
  FROM jsonb_array_elements(events) AS event
)
WHERE events @> '[{"from_status": "no_answer"}]';

-- 3. Update the column default and CHECK constraint
ALTER TABLE public.applications
  ALTER COLUMN status SET DEFAULT 'applied';

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status IN (
    'wishlist', 'applied', 'cancelled', 'withdrew', 'rejected',
    'interviews', 'no_offer', 'offer', 'accepted', 'declined'
  ));
