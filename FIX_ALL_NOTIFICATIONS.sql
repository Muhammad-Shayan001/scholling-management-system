-- =====================================================================
-- SKOLIC: ENABLE REALTIME + FIX NOTIFICATIONS FULLY
-- Run ALL of this in Supabase Dashboard → SQL Editor
-- =====================================================================

-- ── 1. Enable Supabase Realtime on the notifications table ──────────
-- Without this, the instant in-app toast popups WON'T fire.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Drop and recreate the publication to include notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
  ) THEN
    RAISE NOTICE 'notifications already in supabase_realtime publication';
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE 'Added notifications to supabase_realtime publication';
  END IF;
END $$;

-- ── 2. Add institution_type to schools (fixes academy/college error) ─
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS institution_type TEXT NOT NULL DEFAULT 'school';

ALTER TABLE public.schools
DROP CONSTRAINT IF EXISTS schools_institution_type_check;

ALTER TABLE public.schools
ADD CONSTRAINT schools_institution_type_check
CHECK (institution_type IN ('school', 'college', 'university', 'academy'));

-- ── 3. Ensure all required schools columns exist ─────────────────────
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

-- ── 4. Fix notification RLS to allow service role reads ──────────────
-- The admin client uses service_role which bypasses RLS, so this is fine.
-- But ensure the user can read their own notifications too via normal client:
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (used by server actions) can do everything:
DROP POLICY IF EXISTS "Service role full access notifications" ON public.notifications;
CREATE POLICY "Service role full access notifications"
  ON public.notifications
  USING (true)
  WITH CHECK (true);

-- ── 5. Reload PostgREST schema cache ─────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 6. Verify everything is set up ───────────────────────────────────
SELECT
  'Notifications table columns' AS check_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'notifications' AND table_schema = 'public'

UNION ALL

SELECT
  'Schools institution_type column',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name = 'institution_type'
  AND table_schema = 'public';
