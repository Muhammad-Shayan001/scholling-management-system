-- ============================================================
-- Multi-Campus System: Database Migration
-- ============================================================
-- This creates the junction table that allows one admin to manage
-- multiple schools (campuses). Each "campus" is a row in the
-- existing `schools` table — no schema changes needed elsewhere.
-- ============================================================

-- 1. Junction table: admin ↔ campus (school)
CREATE TABLE IF NOT EXISTS admin_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_id, school_id)
);

-- 2. Add campus-specific columns to schools (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='campus_code') THEN
    ALTER TABLE schools ADD COLUMN campus_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='campus_type') THEN
    ALTER TABLE schools ADD COLUMN campus_type TEXT DEFAULT 'main';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='campus_timing') THEN
    ALTER TABLE schools ADD COLUMN campus_timing TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='description') THEN
    ALTER TABLE schools ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='banner_url') THEN
    ALTER TABLE schools ADD COLUMN banner_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='theme_color') THEN
    ALTER TABLE schools ADD COLUMN theme_color TEXT DEFAULT '#6366f1';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='is_active') THEN
    ALTER TABLE schools ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='parent_school_id') THEN
    ALTER TABLE schools ADD COLUMN parent_school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. RLS policies for admin_campuses
ALTER TABLE admin_campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_campuses"
  ON admin_campuses FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Seed existing admin-school relationships into admin_campuses
-- This ensures existing admins automatically get their school as a campus
INSERT INTO admin_campuses (admin_id, school_id, is_primary)
SELECT p.id, p.school_id, true
FROM profiles p
WHERE p.role = 'admin' AND p.school_id IS NOT NULL
ON CONFLICT (admin_id, school_id) DO NOTHING;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_campuses_admin_id ON admin_campuses(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_campuses_school_id ON admin_campuses(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_parent_school_id ON schools(parent_school_id);
