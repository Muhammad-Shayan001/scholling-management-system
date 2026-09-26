-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0001: BASELINE SCHEMA
--
-- This migration creates the foundational schema for the multi-tenant school
-- management platform. It establishes:
--   - Core identity tables (profiles, organizations, campuses)
--   - Academic structure (classes, subjects, students, teachers)
--   - Basic operational tables (attendance, assignments, results)
--
-- IMPORTANT: This is a CONSOLIDATED baseline extracted from 50+ SQL files.
-- RLS policies are NOT included here - they will be added in migration 0003
-- after helper functions are created in migration 0002.
--
-- Version: 1.0
-- Date: 2026-09-26
-- Safe to run multiple times: Uses IF NOT EXISTS throughout
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: CUSTOM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'admin',
        'teacher',
        'student',
        'parent'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM (
        'pending',
        'approved',
        'rejected',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: ORGANIZATIONS (Tenant Root)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    registration_number TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'expired', 'canceled')),
    timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
    currency TEXT NOT NULL DEFAULT 'PKR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organizations IS 'Tenant root: Each organization represents one school system/institution';
COMMENT ON COLUMN public.organizations.slug IS 'URL-safe unique identifier for the organization';


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: CAMPUSES (Physical Locations)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    principal_name TEXT,
    campus_type TEXT DEFAULT 'main' CHECK (campus_type IN ('main', 'branch')),
    campus_timing TEXT,
    description TEXT,
    banner_url TEXT,
    theme_color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

COMMENT ON TABLE public.campuses IS 'Physical school locations within an organization';
CREATE INDEX IF NOT EXISTS idx_campuses_organization ON public.campuses(organization_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: PROFILES (User Identity)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending',
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Karachi',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Core user profile - links to Supabase auth.users';
COMMENT ON COLUMN public.profiles.role IS 'Primary role - use organization_members for multi-role support';
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: ORGANIZATION MEMBERSHIP
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

COMMENT ON TABLE public.organization_members IS 'Links users to organizations (tenant membership)';
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: CAMPUS MEMBERSHIPS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campus_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campus_id, user_id)
);

COMMENT ON TABLE public.campus_memberships IS 'Which campuses a user can access within their organization';
CREATE INDEX IF NOT EXISTS idx_campus_members_campus ON public.campus_memberships(campus_id);
CREATE INDEX IF NOT EXISTS idx_campus_members_user ON public.campus_memberships(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: ACADEMIC STRUCTURE
-- ─────────────────────────────────────────────────────────────────────────────

-- Classes (Grade + Section)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    section TEXT,
    class_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    academic_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_org ON public.classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_classes_campus ON public.classes(campus_id);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_org ON public.subjects(organization_id);
CREATE INDEX IF NOT EXISTS idx_subjects_campus ON public.subjects(campus_id);

-- Class-Subject Mapping
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: STUDENT PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admission_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT,
    photo_url TEXT,
    address TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated', 'withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_students_org ON public.students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_campus ON public.students(campus_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON public.students(organization_id, admission_number);

-- Student Class Enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    roll_number TEXT,
    enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
    UNIQUE(student_id, class_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.student_enrollments(class_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9: GUARDIANS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    cnic TEXT,
    occupation TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_user ON public.guardians(user_id);

-- Student-Guardian Relationship
CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian ON public.student_guardians(guardian_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10: TEACHER PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_number TEXT,
    department TEXT,
    qualification TEXT,
    experience_years INTEGER,
    joining_date DATE,
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'terminated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_teachers_org ON public.teachers(organization_id);
CREATE INDEX IF NOT EXISTS idx_teachers_campus ON public.teachers(campus_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 11: ATTENDANCE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave', 'excused')),
    marked_by UUID NOT NULL REFERENCES public.profiles(id),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr', 'biometric', 'auto')),
    notes TEXT,
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 12: ASSIGNMENTS & SUBMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    attachment_url TEXT,
    max_marks INTEGER,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_org ON public.assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_url TEXT,
    text_answer TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded', 'returned')),
    marks_obtained INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 13: EXAMS & RESULTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('quiz', 'midterm', 'final', 'monthly', 'annual')),
    academic_year TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_org ON public.exams(organization_id);
CREATE INDEX IF NOT EXISTS idx_exams_year ON public.exams(academic_year);

CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    UNIQUE(exam_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam ON public.exam_subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_class ON public.exam_subjects(class_id);

CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    entered_by UUID NOT NULL REFERENCES public.profiles(id),
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    UNIQUE(exam_subject_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_marks_exam_subject ON public.marks(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks(student_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 14: REPORT CARDS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    total_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
    marks_obtained NUMERIC(7,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    grade TEXT,
    rank INTEGER,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'finalized')),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_report_cards_student ON public.report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_exam ON public.report_cards(exam_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 15: TIMETABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    period_number INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    academic_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, day_of_week, period_number, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.timetable(teacher_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 16: ANNOUNCEMENTS & NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT CHECK (target_role IN ('all', 'admin', 'teacher', 'student', 'parent')),
    target_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attachment_url TEXT,
    expires_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 17: HOLIDAYS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'students_only', 'teachers_only')),
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, campus_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_org ON public.holidays(organization_id);
CREATE INDEX IF NOT EXISTS idx_holidays_dates ON public.holidays(start_date, end_date);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 18: AUTHENTICATION SUPPORT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token_hash) WHERE used_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 19: ADMIN INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_role user_role NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.admin_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.admin_invitations(token_hash) WHERE accepted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 20: TRIGGERS FOR updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
--
-- Next Steps:
--   1. Run migration 0002_rls_helpers.sql (creates helper functions)
--   2. Run migration 0003_rls_policies.sql (enables row-level security)
--   3. Run migration 0004_indexes.sql (adds performance indexes)
--   4. Run migration 0005_storage_buckets.sql (configures storage)
--
-- Note: This schema establishes organizations as the root tenant entity.
-- The old "schools" table has been replaced with organizations + campuses.
-- ═══════════════════════════════════════════════════════════════════════════════
