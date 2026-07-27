/*
# Fix security issues: tighten RLS, storage listing, and function privileges

## Overview
Addresses four security findings from the security review:
1. pictures INSERT policy allowed unrestricted inserts (WITH CHECK (true)).
2. public storage bucket allowed file listing via a SELECT policy.
3. promote_first_user() was executable by anon and authenticated roles.
4. (The above three are the distinct issues; this migration fixes all of them.)

## 1. pictures INSERT policy — add ownership check

### Problem
The INSERT policy `insert_pictures_authenticated` used `WITH CHECK (true)`,
meaning any authenticated user could insert a row with an arbitrary
`uploaded_by` value (impersonating another user) or with fields that should
be restricted.

### Fix
Replace `WITH CHECK (true)` with `WITH CHECK (auth.uid() = uploaded_by)`.
Since `uploaded_by` has `DEFAULT auth.uid()`, an insert that omits the column
still satisfies the check. A user can no longer set `uploaded_by` to someone
else's ID.

## 2. storage.objects — remove listing (SELECT) policy

### Problem
The `read_anime_images` SELECT policy on storage.objects allowed any
authenticated user to LIST all files in the anime-images bucket via the
Storage API, exposing the full file inventory.

### Fix
Drop the `read_anime_images` SELECT policy. The bucket remains public, so
individual files are still served via their public URLs (getPublicUrl) —
public URL serving bypasses RLS. Only the listing API endpoint is now
blocked, so users can view images they have a link to but cannot enumerate
the bucket's contents.

## 3. promote_first_user() — revoke EXECUTE from anon and authenticated

### Problem
The `promote_first_user()` function had EXECUTE granted to `anon` and
`authenticated` roles. Although it is SECURITY DEFINER and only meant to
run via the `on_auth_user_created` trigger on `auth.users`, allowing client
roles to call it directly is an unnecessary privilege surface.

### Fix
REVOKE EXECUTE on `promote_first_user()` from `anon` and `authenticated`.
The trigger fires as `postgres` (the table owner), so the function still
works correctly. Only `postgres` and `service_role` retain EXECUTE.

## 4. Security Summary
- pictures INSERT: now ownership-scoped (auth.uid() = uploaded_by).
- storage.objects: listing blocked (SELECT policy removed); public URL
  serving still works because the bucket is public.
- promote_first_user(): no longer executable by anon or authenticated.

## 5. Notes
- Re-running is safe: policies are dropped before re-creating; REVOKE is
  idempotent.
- No data is lost — all changes are policy/privilege adjustments.
*/

-- 1. pictures INSERT: ownership check
DROP POLICY IF EXISTS "insert_pictures_authenticated" ON pictures;
DROP POLICY IF EXISTS "insert_pictures_owner" ON pictures;
CREATE POLICY "insert_pictures_owner" ON pictures
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- 2. storage.objects: remove listing policy (keep bucket public for URL serving)
DROP POLICY IF EXISTS "read_anime_images" ON storage.objects;

-- 3. promote_first_user(): revoke EXECUTE from anon and authenticated
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM anon;
REVOKE EXECUTE ON FUNCTION promote_first_user() FROM authenticated;
