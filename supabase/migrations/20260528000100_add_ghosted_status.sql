-- Add 'ghosted' status for applications with no response after 30 days

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status IN (
    'wishlist', 'applied', 'ghosted', 'cancelled', 'withdrew', 'rejected',
    'interviews', 'no_offer', 'offer', 'accepted', 'declined'
  ));
