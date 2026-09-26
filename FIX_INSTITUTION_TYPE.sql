-- =====================================================================
-- SKOLIC: ADD institution_type + ALL MISSING COLUMNS TO schools TABLE
-- Run this ONCE in your Supabase → SQL Editor
-- =====================================================================

-- 1. Add the institution_type column (the one causing the error)
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS institution_type TEXT NOT NULL DEFAULT 'school';

-- 2. Add a CHECK constraint so only valid types are accepted
ALTER TABLE public.schools
DROP CONSTRAINT IF EXISTS schools_institution_type_check;

ALTER TABLE public.schools
ADD CONSTRAINT schools_institution_type_check
CHECK (institution_type IN ('school', 'college', 'university', 'academy'));

-- 3. Add all other columns the app expects (safe - IF NOT EXISTS won't break anything)
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS school_type TEXT DEFAULT 'Secondary School',
ADD COLUMN IF NOT EXISTS education_board TEXT DEFAULT 'Federal Board',
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS ntn_number TEXT,
ADD COLUMN IF NOT EXISTS school_motto TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#4f46e5',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#818cf8',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS map_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS principal_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 4. The schema cache refresh is handled automatically by Supabase after the migration completes.
-- If the dashboard still shows old columns, refresh the page or run the migration again.

-- 5. Verify the column exists (should return rows with institution_type visible)
SELECT id, name, institution_type FROM public.schools LIMIT 5;
