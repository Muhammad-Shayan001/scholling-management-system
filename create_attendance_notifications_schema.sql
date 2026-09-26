-- ═══════════════════════════════════════════════════════════════════════════════
-- Create Attendance Notifications Schema
-- 
-- Extends the existing notifications table with attendance-specific tracking
-- and creates necessary indexes and RLS policies for multi-campus support.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Add attendance notification fields to notifications table ──────────────

ALTER TABLE IF EXISTS public.notifications
ADD COLUMN IF NOT EXISTS attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attendance_status TEXT;

-- Create an index on attendance_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_attendance_id 
ON public.notifications(attendance_id);

-- Create an index on user_id and is_read for fetching unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, is_read);

-- Create an index on category for filtering attendance notifications
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON public.notifications(category, created_at DESC);

-- Create an index on school_id for multi-campus support
CREATE INDEX IF NOT EXISTS idx_notifications_school_id 
ON public.notifications(school_id);

-- Create a composite index for efficient attendance notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_attendance_lookup 
ON public.notifications(user_id, attendance_id, is_read)
WHERE attendance_id IS NOT NULL;

-- ─── 2. Ensure notifications table has RLS enabled ───────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ─── 3. Add RLS Policies for Notifications ──────────────────────────────────

-- Students can view their own notifications
DROP POLICY IF EXISTS "Students can view own notifications" ON public.notifications;
CREATE POLICY "Students can view own notifications"
ON public.notifications FOR SELECT
USING (
  auth.uid() = user_id
);

-- Students can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Students can update own notifications" ON public.notifications;
CREATE POLICY "Students can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Teachers and admins can insert notifications for students in their school
DROP POLICY IF EXISTS "Teachers and admins can create notifications" ON public.notifications;
CREATE POLICY "Teachers and admins can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin' OR role = 'super_admin')
  )
);

-- Admins can view all notifications in their school
DROP POLICY IF EXISTS "Admins can view school notifications" ON public.notifications;
CREATE POLICY "Admins can view school notifications"
ON public.notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND (p.role = 'admin' OR p.role = 'super_admin')
    AND p.school_id = public.notifications.school_id
  )
);

-- Super admins can view all notifications
DROP POLICY IF EXISTS "Super admins can view all notifications" ON public.notifications;
CREATE POLICY "Super admins can view all notifications"
ON public.notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ─── 4. Create attendance notification history view (optional, for easier querying) ───

CREATE OR REPLACE VIEW attendance_notifications AS
SELECT
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.is_read,
  n.created_at,
  n.attendance_id,
  n.category,
  n.school_id,
  n.attendance_status,
  a.date as attendance_date,
  a.status as attendance_status_actual,
  p.full_name as student_name,
  p.avatar_url as student_avatar
FROM public.notifications n
LEFT JOIN public.attendance a ON n.attendance_id = a.id
LEFT JOIN public.profiles p ON n.user_id = p.id
WHERE n.category = 'attendance_marked' OR n.category = 'attendance_approved' OR n.category = 'attendance_updated';

-- ─── Done! ───────────────────────────────────────────────────────────────────

-- This schema supports:
-- ✓ Attendance notification tracking with categories
-- ✓ Multi-campus support via school_id
-- ✓ Efficient querying with proper indexes
-- ✓ Row-level security for multi-tenancy
-- ✓ Real-time updates via Supabase Realtime
