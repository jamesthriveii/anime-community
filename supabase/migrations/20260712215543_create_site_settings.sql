/*
# Site settings: global open/locked toggle

## Overview
Adds a `site_settings` table that stores a single global row controlling
whether the gallery is open to all users or locked (admin-only access).
The admin can toggle this state from the admin panel.

## 1. New Tables

### `site_settings`
A single-row table (enforced by CHECK constraint) holding global site state.
- `id` (int, primary key, always 1) — ensures only one row exists.
- `is_locked` (boolean, not null, default false) — when true, non-admin users
  see a "site is closed" screen instead of the gallery.
- `locked_message` (text, not null, default) — the message shown to non-admin
  users when the site is locked.
- `updated_at` (timestamptz, default now()) — last toggle time.
- `updated_by` (uuid, nullable, references auth.users) — which admin last
  changed the setting.

## 2. Security

### site_settings
- RLS enabled.
- SELECT: any authenticated user can read the lock state (needed so the
  frontend knows whether to show the gallery or the closed screen).
  `USING (true)` is acceptable here because the data is intentionally shared
  with all authenticated users — it's a public boolean flag, not private data.
- UPDATE: admin-only (`EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())`).
- No INSERT or DELETE policies: the single row is seeded by this migration and
  should never be created or removed by the client.

## 3. Seed Data
Inserts one row with `id = 1, is_locked = false` (site starts open).

## 4. Notes
- Re-running is safe: CREATE IF NOT EXISTS, drop-before-create on policies,
  ON CONFLICT DO NOTHING on the seed insert.
- The existing `admins` table and auto-promote trigger (from a previous
  migration) remain unchanged. The first user to sign up is auto-promoted
  to admin.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_locked boolean NOT NULL DEFAULT false,
  locked_message text NOT NULL DEFAULT 'The gallery is currently closed for maintenance. Please check back soon!',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_site_settings" ON site_settings;
CREATE POLICY "select_site_settings" ON site_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "update_site_settings_admin" ON site_settings;
CREATE POLICY "update_site_settings_admin" ON site_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- seed the single row
INSERT INTO site_settings (id, is_locked) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;
