-- Rename status value 'no_answer' to 'applied'

-- Drop the constraint first so data updates don't violate it
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

-- Update DEFAULT
ALTER TABLE public.applications
  ALTER COLUMN status SET DEFAULT 'applied';

-- Update current status values
UPDATE public.applications
  SET status = 'applied'
  WHERE status = 'no_answer';

-- Update 'no_answer' inside events JSONB (to_status field)
UPDATE public.applications
  SET events = (
    SELECT jsonb_agg(
      CASE
        WHEN event->>'to_status' = 'no_answer'
          THEN jsonb_set(event, '{to_status}', '"applied"')
        ELSE event
      END
    )
    FROM jsonb_array_elements(events) AS event
  )
  WHERE events @> '[{"to_status": "no_answer"}]';

-- Update 'no_answer' inside events JSONB (from_status field)
UPDATE public.applications
  SET events = (
    SELECT jsonb_agg(
      CASE
        WHEN event->>'from_status' = 'no_answer'
          THEN jsonb_set(event, '{from_status}', '"applied"')
        ELSE event
      END
    )
    FROM jsonb_array_elements(events) AS event
  )
  WHERE events @> '[{"from_status": "no_answer"}]';

-- Re-add the constraint with the new allowed values
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status IN (
    'wishlist', 'applied', 'cancelled', 'withdrew', 'rejected',
    'interviews', 'no_offer', 'offer', 'accepted', 'declined'
  ));
