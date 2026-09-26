-- ─── Upgrade Schools Table ──────────────────────────────────────────────────
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS principal_name TEXT,
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ─── Row Level Security (RLS) for Multi-Tenancy ──────────────────────────────

-- 1. Schools Policy
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admins can manage all schools" ON public.schools;
CREATE POLICY "Super Admins can manage all schools" ON public.schools FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;
CREATE POLICY "Users can view their own school" ON public.schools FOR SELECT TO authenticated USING (id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Profiles Policy (Isolation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "School staff can view school profiles" ON public.profiles;

-- 2a. Every user can see their own profile (Essential for login)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- 2b. Super Admins can see everything
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 2c. Users can see others in the same school
CREATE POLICY "School staff can view school profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- 3. Academic Tables Isolation
-- Classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based class isolation" ON public.classes;
CREATE POLICY "School-based class isolation" ON public.classes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.classes.school_id)));

-- Student Profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based student isolation" ON public.student_profiles;
CREATE POLICY "School-based student isolation" ON public.student_profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.student_profiles.school_id)));

-- Teacher Profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based teacher isolation" ON public.teacher_profiles;
CREATE POLICY "School-based teacher isolation" ON public.teacher_profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.teacher_profiles.school_id)));

-- Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based subject isolation" ON public.subjects;
CREATE POLICY "School-based subject isolation" ON public.subjects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.subjects.school_id)));

-- Timetable
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based timetable isolation" ON public.timetable;
CREATE POLICY "School-based timetable isolation" ON public.timetable FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.timetable.school_id)));

-- Exam Timetable
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based exam isolation" ON public.exam_timetable;
CREATE POLICY "School-based exam isolation" ON public.exam_timetable FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.exam_timetable.school_id)));

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based assignment isolation" ON public.assignments;
CREATE POLICY "School-based assignment isolation" ON public.assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.assignments.school_id)));

-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based attendance isolation" ON public.attendance;
CREATE POLICY "School-based attendance isolation" ON public.attendance FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.attendance.school_id)));

-- Results
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based results isolation" ON public.results;
CREATE POLICY "School-based results isolation" ON public.results FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.results.school_id)));

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based announcement isolation" ON public.announcements;
CREATE POLICY "School-based announcement isolation" ON public.announcements FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.announcements.school_id)));

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own notifications" ON public.notifications;
CREATE POLICY "Users can only see their own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own conversations" ON public.conversations;
CREATE POLICY "Users can only see their own conversations" ON public.conversations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.conversations.id AND user_id = auth.uid()));

-- Conversation Participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can see participants of their conversations" ON public.conversation_participants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.conversation_participants AS cp WHERE cp.conversation_id = public.conversation_participants.conversation_id AND cp.user_id = auth.uid()));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see messages in their conversations" ON public.messages;
CREATE POLICY "Users can see messages in their conversations" ON public.messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.messages.conversation_id AND user_id = auth.uid()));
