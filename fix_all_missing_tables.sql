-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE MIGRATION: Create ALL missing tables referenced by application
-- 
-- This single migration ensures every table the app code queries actually exists.
-- Safe to re-run (uses IF NOT EXISTS everywhere).
--
-- Run this in your Supabase SQL Editor AFTER fix_attendance_table.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. TEACHER ASSIGNMENTS (subject ↔ class ↔ teacher mapping) ──────────────
-- Used by: profile.ts, results.ts

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read teacher_assignments" ON public.teacher_assignments;
CREATE POLICY "Read teacher_assignments" ON public.teacher_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write teacher_assignments" ON public.teacher_assignments;
CREATE POLICY "Write teacher_assignments" ON public.teacher_assignments FOR ALL USING (true);


-- ─── 2. ADMINS TABLE (admin-specific profile data) ──────────────────────────
-- Used by: profile.ts getFullProfile() and updateProfile()

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  cnic TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read admins" ON public.admins;
CREATE POLICY "Read admins" ON public.admins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write admins" ON public.admins;
CREATE POLICY "Write admins" ON public.admins FOR ALL USING (true);


-- ─── 3. HOLIDAYS TABLE ──────────────────────────────────────────────────────
-- Used by: holidays.ts

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'everyone' CHECK (type IN ('everyone', 'students', 'teachers')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, date)
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read holidays" ON public.holidays;
CREATE POLICY "Read holidays" ON public.holidays FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write holidays" ON public.holidays;
CREATE POLICY "Write holidays" ON public.holidays FOR ALL USING (true);


-- ─── 4. FINAL RESULTS TABLE ─────────────────────────────────────────────────
-- Used by: results.ts publishFinalResults() and getStudentFinalResult()

CREATE TABLE IF NOT EXISTS public.final_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  total_marks NUMERIC NOT NULL DEFAULT 0,
  obtained_marks NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_grade TEXT NOT NULL DEFAULT 'F',
  term TEXT NOT NULL DEFAULT 'Final Term',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, term)
);

ALTER TABLE public.final_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read final_results" ON public.final_results;
CREATE POLICY "Read final_results" ON public.final_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write final_results" ON public.final_results;
CREATE POLICY "Write final_results" ON public.final_results FOR ALL USING (true);


-- ─── 5. ASSIGNMENTS TABLE ───────────────────────────────────────────────────
-- Used by: assignments.ts

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  deadline TIMESTAMPTZ NOT NULL,
  max_marks INTEGER,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read assignments" ON public.assignments;
CREATE POLICY "Read assignments" ON public.assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write assignments" ON public.assignments;
CREATE POLICY "Write assignments" ON public.assignments FOR ALL USING (true);


-- ─── 6. ASSIGNMENT SUBMISSIONS TABLE ─────────────────────────────────────────
-- Used by: assignments.ts submitAssignment(), gradeSubmission()

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  text_answer TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
  marks INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "Read assignment_submissions" ON public.assignment_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "Write assignment_submissions" ON public.assignment_submissions FOR ALL USING (true);


-- ─── 7. FIX ANNOUNCEMENTS TABLE — Add missing columns ───────────────────────
-- The base schema has: title, content, author_id, school_id, target_role
-- The app code expects: priority, target_type, target_id, attachment_url, 
--                       expires_at, created_by

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS expires_at DATE;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ─── 8. FIX RESULTS TABLE — Ensure all required columns exist ───────────────

ALTER TABLE public.results ADD COLUMN IF NOT EXISTS exam_name TEXT DEFAULT 'Final Term';
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS remarks TEXT;


-- ─── 9. FIX STUDENT PROFILES — Add extended columns ─────────────────────────

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_cnic TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS admission_date DATE;


-- ─── 10. FIX TEACHER PROFILES — Add extended columns ────────────────────────

ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS subjects TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS address TEXT;


-- ─── 11. CONVERSATIONS & MESSAGES (Chat system) ─────────────────────────────
-- Used by: messages.ts

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for chat
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own conversations" ON public.conversations;
CREATE POLICY "Users read own conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users create conversations" ON public.conversations;
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users read own participations" ON public.conversation_participants;
CREATE POLICY "Users read own participations" ON public.conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users join conversations" ON public.conversation_participants;
CREATE POLICY "Users join conversations" ON public.conversation_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users read conversation messages" ON public.messages;
CREATE POLICY "Users read conversation messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Users update messages" ON public.messages;
CREATE POLICY "Users update messages" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);


-- ─── 12. TIMETABLE TABLE (if missing) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  period_number INTEGER NOT NULL DEFAULT 1,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read timetable" ON public.timetable;
CREATE POLICY "Read timetable" ON public.timetable FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write timetable" ON public.timetable;
CREATE POLICY "Write timetable" ON public.timetable FOR ALL USING (true);

NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables the application references now exist.
-- 
-- Run order:
--   1. fix_attendance_table.sql   (attendance fixes)
--   2. fix_exams_table.sql        (exam_schedules table)
--   3. fix_all_missing_tables.sql (THIS FILE — everything else)
-- ═══════════════════════════════════════════════════════════════════════════════
