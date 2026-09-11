-- Supabase security linter: neither anon nor authenticated should be able to
-- call SECURITY DEFINER functions unless the app actually relies on it via
-- the PostgREST API.

-- delete_user() is called by authenticated users only, from the account
-- deletion server action (src/app/settings/actions.ts). Drop the implicit
-- PUBLIC grant and keep access scoped to authenticated.
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- rls_auto_enable() is a one-off setup helper that isn't called by the app
-- through the API (no rpc() call anywhere in the codebase). It should never
-- have been reachable by anon/authenticated; revoke it entirely.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
