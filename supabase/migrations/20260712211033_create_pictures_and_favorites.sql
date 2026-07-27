/*
# Create pictures and favorites tables for anime gallery

## Overview
This migration sets up the data layer for an anime picture gallery where
authenticated users can browse a curated collection of anime artwork and
save their favorite pieces. Pictures are pre-seeded shared content; favorites
are private to each user.

## 1. New Tables

### `pictures`
Stores the curated anime artwork collection. This is shared, seeded content —
users do not create or modify these rows.
- `id` (uuid, primary key)
- `title` (text, not null) — display title of the artwork
- `category` (text, not null) — e.g. "Illustration", "Mural", "Cosplay", "Sketch"
- `image_url` (text, not null) — thumbnail image URL (Pexels, resized)
- `full_url` (text, not null) — full-resolution image URL for the lightbox
- `artist` (text) — optional credit for the artist/photographer
- `created_at` (timestamptz, default now())

### `favorites`
Lets each authenticated user bookmark pictures. Owner-scoped via `user_id`.
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to the authenticated user, references auth.users, cascade on delete)
- `picture_id` (uuid, not null, references pictures, cascade on delete)
- `created_at` (timestamptz, default now())
- Unique constraint on (user_id, picture_id) so a user can favorite a picture only once.

## 2. Security

### pictures
- RLS enabled.
- SELECT scoped to `authenticated` — the gallery is behind sign-in, so only
  logged-in users can browse. No insert/update/delete policies: pictures are
  seeded via migration and are read-only from the client.

### favorites
- RLS enabled.
- Full owner-scoped CRUD (4 policies): a user can only read, create, update,
  or delete their own favorites. `user_id` defaults to `auth.uid()` so inserts
  that omit it still satisfy the WITH CHECK policy.

## 3. Seed Data
Inserts 24 curated anime artwork rows sourced from Pexels (free license).

## 4. Notes
- Re-running this migration is safe: `CREATE TABLE IF NOT EXISTS`, policies are
  dropped before re-creating, and seed inserts use `ON CONFLICT DO NOTHING`.
*/

-- pictures table
CREATE TABLE IF NOT EXISTS pictures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  full_url text NOT NULL,
  artist text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pictures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_pictures_authenticated" ON pictures;
CREATE POLICY "select_pictures_authenticated"
ON pictures FOR SELECT
TO authenticated USING (true);

-- favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  picture_id uuid NOT NULL REFERENCES pictures(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, picture_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites"
ON favorites FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites"
ON favorites FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites"
ON favorites FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- index for looking up a user's favorites efficiently
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_picture_id_idx ON favorites(picture_id);

-- seed data: 24 curated anime artworks from Pexels (free license)
INSERT INTO pictures (title, category, image_url, full_url, artist) VALUES
('Sakura Sketch', 'Sketch', 'https://images.pexels.com/photos/11567831/pexels-photo-11567831.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/11567831/pexels-photo-11567831.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Tokyo Mural', 'Mural', 'https://images.pexels.com/photos/14205102/pexels-photo-14205102.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/14205102/pexels-photo-14205102.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Studio Hands', 'Sketch', 'https://images.pexels.com/photos/14442408/pexels-photo-14442408.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/14442408/pexels-photo-14442408.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Cosplay Portrait', 'Cosplay', 'https://images.pexels.com/photos/15326117/pexels-photo-15326117.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/15326117/pexels-photo-15326117.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Neon Dreams', 'Character', 'https://images.pexels.com/photos/15401700/pexels-photo-15401700.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/15401700/pexels-photo-15401700.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Flower Girl', 'Mural', 'https://images.pexels.com/photos/20329611/pexels-photo-20329611.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/20329611/pexels-photo-20329611.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Canvas Bloom', 'Sketch', 'https://images.pexels.com/photos/22500378/pexels-photo-22500378.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/22500378/pexels-photo-22500378.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Color Study', 'Illustration', 'https://images.pexels.com/photos/26828709/pexels-photo-26828709.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/26828709/pexels-photo-26828709.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Pastel Vision', 'Illustration', 'https://images.pexels.com/photos/30486841/pexels-photo-30486841.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/30486841/pexels-photo-30486841.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Ink Spirit', 'Sketch', 'https://images.pexels.com/photos/31120860/pexels-photo-31120860.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/31120860/pexels-photo-31120860.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Urban Art', 'Mural', 'https://images.pexels.com/photos/31265562/pexels-photo-31265562.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/31265562/pexels-photo-31265562.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Tablet Dreams', 'Illustration', 'https://images.pexels.com/photos/31403466/pexels-photo-31403466.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/31403466/pexels-photo-31403466.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Katana Spirit', 'Cosplay', 'https://images.pexels.com/photos/33495060/pexels-photo-33495060.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/33495060/pexels-photo-33495060.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Pencil Lines', 'Sketch', 'https://images.pexels.com/photos/33638916/pexels-photo-33638916.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/33638916/pexels-photo-33638916.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Neon Bloom', 'Character', 'https://images.pexels.com/photos/36942551/pexels-photo-36942551.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/36942551/pexels-photo-36942551.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('City Canvas', 'Mural', 'https://images.pexels.com/photos/37105395/pexels-photo-37105395.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/37105395/pexels-photo-37105395.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Creative Flow', 'Illustration', 'https://images.pexels.com/photos/37461261/pexels-photo-37461261.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/37461261/pexels-photo-37461261.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Artisan Soul', 'Sketch', 'https://images.pexels.com/photos/37560480/pexels-photo-37560480.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/37560480/pexels-photo-37560480.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Sakura Spirit', 'Character', 'https://images.pexels.com/photos/38190725/pexels-photo-38190725.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/38190725/pexels-photo-38190725.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Digital Heart', 'Illustration', 'https://images.pexels.com/photos/38454106/pexels-photo-38454106.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/38454106/pexels-photo-38454106.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Tulip Muse', 'Sketch', 'https://images.pexels.com/photos/5146441/pexels-photo-5146441.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/5146441/pexels-photo-5146441.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Puffer Ink', 'Sketch', 'https://images.pexels.com/photos/6593335/pexels-photo-6593335.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/6593335/pexels-photo-6593335.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Seaside Anime', 'Cosplay', 'https://images.pexels.com/photos/7429230/pexels-photo-7429230.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/7429230/pexels-photo-7429230.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL),
('Wall Whisper', 'Mural', 'https://images.pexels.com/photos/12038947/pexels-photo-12038947.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/12038947/pexels-photo-12038947.jpeg?auto=compress&cs=tinysrgb&w=1600', NULL)
ON CONFLICT DO NOTHING;
