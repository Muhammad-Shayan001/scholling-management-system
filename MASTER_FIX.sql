-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   SKOLIC — MASTER FIX SCRIPT                                   ║
-- ║   Run this ONCE in Supabase Dashboard → SQL Editor             ║
-- ║   This fixes: Notifications + institution_type + Realtime      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Enable Realtime on notifications table
-- (Required for instant in-app toast popups without page refresh)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add to realtime publication if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE '✅ notifications added to supabase_realtime';
  ELSE
    RAISE NOTICE '✅ notifications already in supabase_realtime';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Fix notifications RLS policies
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS (if not already)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.notifications;

-- Recreate clean policies
CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically — no policy needed for it

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: Add institution_type column to schools
-- (Fixes "cannot find column institution_type" error when creating academy/college)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS institution_type TEXT NOT NULL DEFAULT 'school';

ALTER TABLE public.schools
DROP CONSTRAINT IF EXISTS schools_institution_type_check;

ALTER TABLE public.schools
ADD CONSTRAINT schools_institution_type_check
CHECK (institution_type IN ('school', 'college', 'university', 'academy'));

-- ═══════════════════════════════════════════════════════════════════
-- STEP 4: Add all other missing schools columns
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- STEP 5: Reload PostgREST schema cache
-- ═══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════
-- STEP 6: Verify setup — check the results below
-- ═══════════════════════════════════════════════════════════════════
SELECT 'notifications realtime' AS check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN '✅ ENABLED' ELSE '❌ NOT ENABLED' END AS status

UNION ALL

SELECT 'institution_type column',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'institution_type'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END

UNION ALL

SELECT 'notifications table rls',
  CASE WHEN (
    SELECT relrowsecurity FROM pg_class
    WHERE relname = 'notifications'
  ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END;
