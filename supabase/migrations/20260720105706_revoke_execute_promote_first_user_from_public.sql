-- Revoke EXECUTE on promote_first_user() from anon and authenticated.
--
-- The function is SECURITY DEFINER and only meant to run via the
-- on_auth_user_created trigger on auth.users (fired as postgres).
--
-- Note: prior migration 20260714055414 revoked EXECUTE from anon and
-- authenticated directly, but the grant was actually on PUBLIC (which
-- both roles inherit), so those REVOKEs were no-ops. Revoking from PUBLIC
-- is what actually removes the privilege from anon and authenticated.
-- postgres and service_role retain EXECUTE via their explicit grants.
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM anon;
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM PUBLIC;
