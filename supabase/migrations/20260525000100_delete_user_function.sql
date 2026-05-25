-- Allows an authenticated user to delete their own auth.users row.
-- SECURITY DEFINER runs with owner privileges so it can write to auth.users.
-- The WHERE clause pins deletion to the caller's own ID (auth.uid()).
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
