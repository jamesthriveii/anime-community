/*
# Open uploads to all authenticated users

## Overview
Previously only admins could insert/delete pictures and upload to storage.
This migration changes the policies so ANY authenticated user can upload
their own anime images to the gallery, and each user can only delete or
modify their own uploads. Admins retain the ability to delete any upload
(for moderation).

## 1. Modified Tables

### `pictures`
- `uploaded_by` now has `DEFAULT auth.uid()` so inserts that omit it still
  satisfy the ownership WITH CHECK. (Previously had no default.)

## 2. Security Changes

### pictures INSERT
- Changed from admin-only to any authenticated user. No ownership restriction
  on INSERT beyond being authenticated — the `DEFAULT auth.uid()` fills
  `uploaded_by` automatically.

### pictures DELETE
- Owner-only: `auth.uid() = uploaded_by`. Admins can also delete any row
  via `EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())`.

### pictures UPDATE
- Owner-only (same predicate as DELETE), plus admin override. Allows users
  to edit their own upload's title/tags in the future.

### storage.objects (anime-images bucket)
- INSERT: any authenticated user can upload to the bucket.
- DELETE: the uploader (folder prefix = user id) or an admin can remove files.
  The path format is `{user_id}/{timestamp}.{ext}`, so the first path segment
  identifies the owner.

## 3. Notes
- Re-running is safe: policies are dropped before re-creating.
- The admins table and auto-promote trigger remain in place — admins still
  have moderation powers (delete any upload) but uploads are no longer
  admin-gated.
*/

-- 1. Set default on uploaded_by
ALTER TABLE pictures ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- 2. pictures INSERT: any authenticated user
DROP POLICY IF EXISTS "insert_pictures_admin" ON pictures;
DROP POLICY IF EXISTS "insert_pictures_authenticated" ON pictures;
CREATE POLICY "insert_pictures_authenticated" ON pictures
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. pictures DELETE: owner or admin
DROP POLICY IF EXISTS "delete_pictures_admin" ON pictures;
DROP POLICY IF EXISTS "delete_pictures_owner_or_admin" ON pictures;
CREATE POLICY "delete_pictures_owner_or_admin" ON pictures
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- 4. pictures UPDATE: owner or admin
DROP POLICY IF EXISTS "update_pictures_admin" ON pictures;
DROP POLICY IF EXISTS "update_pictures_owner_or_admin" ON pictures;
CREATE POLICY "update_pictures_owner_or_admin" ON pictures
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = uploaded_by
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- 5. storage INSERT: any authenticated user
DROP POLICY IF EXISTS "upload_anime_images" ON storage.objects;
CREATE POLICY "upload_anime_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anime-images');

-- 6. storage DELETE: owner (folder prefix) or admin
DROP POLICY IF EXISTS "delete_anime_images" ON storage.objects;
CREATE POLICY "delete_anime_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'anime-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
    )
  );
