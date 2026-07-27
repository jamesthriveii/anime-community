/*
# Admin panel: admins table, tags, storage bucket, and policies

## Overview
Adds everything needed for an admin-only image upload panel:
- An `admins` table that tracks which users are administrators.
- A database trigger that automatically promotes the FIRST user who signs up
  to admin, so the project owner gets admin access without manual setup.
- A `tags` column on `pictures` so uploaded images can be tagged.
- A `storage_path` column on `pictures` so uploaded files can be cleaned up
  from storage when deleted.
- A public Supabase Storage bucket `anime-images` for storing uploaded files.
- Storage policies: authenticated users can read images; only admins can
  upload and delete.
- Table policies: only admins can insert or delete pictures.

## 1. New Tables

### `admins`
Tracks admin users. One row per admin user.
- `user_id` (uuid, primary key, references auth.users, cascade on delete)
- `created_at` (timestamptz, default now())

## 2. Modified Tables

### `pictures`
- Added `tags` (text[], not null, default empty array) — tags for each image.
- Added `storage_path` (text, nullable) — the path within the `anime-images`
  storage bucket for uploaded files. NULL for seeded rows with external URLs.
- Added `uploaded_by` (uuid, nullable, references auth.users, set null on
  delete) — which admin uploaded the image. NULL for seeded data.

## 3. Security

### admins table
- RLS enabled.
- SELECT only: a user can check whether THEY are an admin. No client-side
  INSERT/UPDATE/DELETE — admin promotion happens only via the database trigger
  or server-side SQL.

### pictures table (new policies in addition to existing SELECT)
- INSERT: admin-only (`EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())`).
- DELETE: admin-only.
- UPDATE: admin-only (for future title/tag editing).

### storage.objects (anime-images bucket)
- SELECT: any authenticated user can read (view) images.
- INSERT: admin-only.
- DELETE: admin-only.

## 4. Trigger: auto-promote first user

`promote_first_user()` runs AFTER INSERT on `auth.users`. If the `admins`
table is empty (no admins exist yet), it inserts the new user's ID into
`admins`. This means the very first person to sign up becomes the admin.
Subsequent sign-ups do NOT get admin access. The function is SECURITY DEFINER
with `search_path = public` to prevent search-path injection.

## 5. Storage Bucket

Creates a public bucket `anime-images` so uploaded images can be served via
public URLs without signed URL generation.

## 6. Notes
- Re-running this migration is safe: all statements use IF NOT EXISTS or
  drop-before-create for policies. The trigger is dropped and recreated.
- The `ON CONFLICT DO NOTHING` on the bucket insert prevents duplicate buckets.
*/

-- 1. admins table
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_admin" ON admins;
CREATE POLICY "select_own_admin" ON admins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Add columns to pictures
ALTER TABLE pictures ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE pictures ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE pictures ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Admin-only insert/delete/update on pictures
DROP POLICY IF EXISTS "insert_pictures_admin" ON pictures;
CREATE POLICY "insert_pictures_admin" ON pictures
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_pictures_admin" ON pictures;
CREATE POLICY "delete_pictures_admin" ON pictures
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_pictures_admin" ON pictures;
CREATE POLICY "update_pictures_admin" ON pictures
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- 4. Trigger: auto-promote first user to admin
CREATE OR REPLACE FUNCTION promote_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins) THEN
    INSERT INTO admins (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION promote_first_user();

-- 5. Storage bucket (public so images serve without signed URLs)
INSERT INTO storage.buckets (id, name, public) VALUES ('anime-images', 'anime-images', true)
ON CONFLICT DO NOTHING;

-- 6. Storage policies for anime-images bucket
DROP POLICY IF EXISTS "read_anime_images" ON storage.objects;
CREATE POLICY "read_anime_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'anime-images');

DROP POLICY IF EXISTS "upload_anime_images" ON storage.objects;
CREATE POLICY "upload_anime_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'anime-images'
    AND EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_anime_images" ON storage.objects;
CREATE POLICY "delete_anime_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'anime-images'
    AND EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );
