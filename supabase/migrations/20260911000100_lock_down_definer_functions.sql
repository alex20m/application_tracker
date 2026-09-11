-- Supabase security linter: neither anon nor authenticated should be able to
-- call SECURITY DEFINER functions unless the app actually relies on it via
-- the PostgREST API.

-- delete_user() is called by authenticated users only, from the account
-- deletion server action (src/app/settings/actions.ts). Drop the implicit
-- PUBLIC grant and keep access scoped to authenticated.
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- rls_auto_enable() is a one-off setup helper that was created directly on
-- the remote project (it's not defined by any migration in this repo, so it
-- doesn't exist on fresh/local databases) and isn't called by the app
-- through the API (no rpc() call anywhere in the codebase). It should never
-- have been reachable by anon/authenticated; revoke it entirely where it
-- exists, and no-op elsewhere.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
