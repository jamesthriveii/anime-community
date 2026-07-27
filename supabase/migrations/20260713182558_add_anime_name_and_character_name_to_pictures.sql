/*
# Add anime_name and character_name to pictures

## Purpose
Lets every uploaded image be tagged with the anime series it comes from and the
character(s) depicted, so the gallery can be searched by anime name or character
name (e.g. "Demon Slayer" or "Tanjiro").

## Changes
1. New columns on `pictures`:
   - `anime_name` (text, nullable) — the anime series/franchise name (e.g. "Demon Slayer").
   - `character_name` (text, nullable) — the character name(s) (e.g. "Tanjiro Kamado").
2. New index:
   - `idx_pictures_anime_name` on `anime_name` (btree) to speed up text searches.

## Security
- No RLS changes. Existing policies on `pictures` already allow authenticated
  users to insert/update their own rows and admins to manage all rows; the new
  columns are covered by those same policies.

## Notes
- Both columns are nullable so existing rows remain valid without backfill.
- No data is lost — this is an additive ALTER TABLE only.
*/

ALTER TABLE pictures
  ADD COLUMN IF NOT EXISTS anime_name text,
  ADD COLUMN IF NOT EXISTS character_name text;

CREATE INDEX IF NOT EXISTS idx_pictures_anime_name ON pictures (anime_name);
