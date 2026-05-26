-- Backfill non-wishlist rows that are missing applied_on, using created_at as best estimate.
UPDATE applications
SET applied_on = created_at::date
WHERE applied_on IS NULL
  AND status != 'wishlist';

-- Enforce that non-wishlist applications always have an applied date.
ALTER TABLE applications
  ADD CONSTRAINT applied_on_required_unless_wishlist
  CHECK (status = 'wishlist' OR applied_on IS NOT NULL);
