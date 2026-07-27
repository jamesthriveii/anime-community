-- Revoke EXECUTE on promote_first_user() from anon and authenticated.
-- The function is SECURITY DEFINER and only meant to run via the
-- on_auth_user_created trigger on auth.users (fired as postgres).
-- Trigger still works; only postgres and service_role retain EXECUTE.
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM anon;
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM authenticated;
