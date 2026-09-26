-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Attendance Table Schema & RLS Policies
-- 
-- Problem: The attendance_id_system.sql migration created the table without
-- the 'class_id' and 'approved_by' columns, and the status CHECK constraint
-- doesn't include 'pending' or 'rejected'. This breaks all attendance
-- operations (insert, approve, reject).
--
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Add missing columns ──────────────────────────────────────────────────

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 2. Fix status CHECK constraint ─────────────────────────────────────────
-- The original constraint only allows ('present','absent','late').
-- The app also needs 'pending' (QR scans) and 'rejected' (denied scans).

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
  CHECK (status IN ('present', 'absent', 'late', 'pending', 'rejected'));

-- ─── 3. Add missing RLS policies ────────────────────────────────────────────

-- Teachers need to SELECT attendance for their assigned class (for approvals & roll call)
DROP POLICY IF EXISTS "Teachers can view class attendance" ON public.attendance;
CREATE POLICY "Teachers can view class attendance" 
ON public.attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid() 
    AND tp.is_class_teacher = true
    AND tp.class_id = public.attendance.class_id
  )
);

-- Teachers also need to view their OWN attendance (already covered by user policy, 
-- but let's also cover school-wide teacher view for admins who are also teachers)
DROP POLICY IF EXISTS "Teachers can view own school attendance" ON public.attendance;
CREATE POLICY "Teachers can view own school attendance" 
ON public.attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'teacher'
    AND p.school_id = public.attendance.school_id
  )
);

-- ─── 4. Verify existing policies still work ──────────────────────────────────

-- Re-create the self-view policy (idempotent)
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
CREATE POLICY "Users can view their own attendance" 
ON public.attendance FOR SELECT 
USING (auth.uid() = user_id);

-- Re-create the admin view policy (idempotent)
DROP POLICY IF EXISTS "Admins can view all attendance in school" ON public.attendance;
CREATE POLICY "Admins can view all attendance in school" 
ON public.attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin')
    AND school_id = public.attendance.school_id
  )
);

-- Re-create the teacher insert policy (idempotent)
DROP POLICY IF EXISTS "Teachers can mark student attendance" ON public.attendance;
CREATE POLICY "Teachers can mark student attendance" 
ON public.attendance FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'teacher' 
    AND school_id = public.attendance.school_id
  )
);

-- Allow students to INSERT their own attendance (QR scan creates a pending record)
DROP POLICY IF EXISTS "Students can submit own attendance" ON public.attendance;
CREATE POLICY "Students can submit own attendance" 
ON public.attendance FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'student'
  )
);

-- ─── Done! ───────────────────────────────────────────────────────────────────
-- After running this, attendance marking, QR scans, approvals, and the 
-- student attendance page will all work correctly.
