-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0004: PERFORMANCE INDEXES
--
-- This migration adds indexes to optimize common query patterns.
-- All foreign keys already have auto-created indexes, so this focuses on:
--   - Composite indexes for common joins
--   - Indexes for search and filtering
--   - Partial indexes for specific conditions
--   - Covering indexes for read-heavy queries
--
-- Version: 1.0
-- Date: 2026-09-26
-- Dependencies: 0001_baseline_schema.sql, 0002_rls_helper_functions.sql, 0003_rls_policies.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: ORGANIZATIONS & CAMPUSES
-- ─────────────────────────────────────────────────────────────────────────────

-- Search organizations by name or slug
CREATE INDEX IF NOT EXISTS idx_organizations_search
ON public.organizations USING gin(to_tsvector('english', name || ' ' || COALESCE(slug, '')));

-- Filter organizations by status
CREATE INDEX IF NOT EXISTS idx_organizations_status
ON public.organizations(status)
WHERE status IN ('active', 'trial');

-- Search campuses by name
CREATE INDEX IF NOT EXISTS idx_campuses_search
ON public.campuses USING gin(to_tsvector('english', name || ' ' || COALESCE(code, '')));

-- Active campuses per organization
CREATE INDEX IF NOT EXISTS idx_campuses_org_active
ON public.campuses(organization_id, is_active);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: MEMBERSHIP & ACCESS
-- ─────────────────────────────────────────────────────────────────────────────

-- Active memberships lookup (RLS helper uses this heavily)
CREATE INDEX IF NOT EXISTS idx_org_members_active
ON public.organization_members(user_id, organization_id, status)
WHERE status = 'active';

-- Campus access lookup (RLS helper uses this)
CREATE INDEX IF NOT EXISTS idx_campus_members_active
ON public.campus_memberships(user_id, campus_id, organization_id);

-- Find primary campus for user
CREATE INDEX IF NOT EXISTS idx_campus_members_primary
ON public.campus_memberships(user_id, is_primary)
WHERE is_primary = TRUE;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: PROFILES & USERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Email lookup for login (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
ON public.profiles(LOWER(email));

-- Active users by role
CREATE INDEX IF NOT EXISTS idx_profiles_role_active
ON public.profiles(role, is_active)
WHERE is_active = TRUE;

-- Search profiles by name
CREATE INDEX IF NOT EXISTS idx_profiles_search
ON public.profiles USING gin(to_tsvector('english', COALESCE(full_name, '')));


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: STUDENTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Lookup student by admission number (unique per org)
CREATE INDEX IF NOT EXISTS idx_students_admission
ON public.students(organization_id, admission_number);

-- Active students per campus
CREATE INDEX IF NOT EXISTS idx_students_campus_active
ON public.students(campus_id, status)
WHERE status = 'active';

-- Search students by name
CREATE INDEX IF NOT EXISTS idx_students_search
ON public.students USING gin(to_tsvector('english', full_name));

-- Find student by user_id (for RLS helper)
CREATE INDEX IF NOT EXISTS idx_students_user
ON public.students(user_id)
WHERE user_id IS NOT NULL;

-- Active enrollments per class
CREATE INDEX IF NOT EXISTS idx_enrollments_class_active
ON public.student_enrollments(class_id, status, academic_year)
WHERE status = 'active';

-- Find enrollments by student and year
CREATE INDEX IF NOT EXISTS idx_enrollments_student_year
ON public.student_enrollments(student_id, academic_year, status);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: TEACHERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Lookup teacher by employee number
CREATE INDEX IF NOT EXISTS idx_teachers_employee
ON public.teachers(organization_id, employee_number);

-- Active teachers per campus
CREATE INDEX IF NOT EXISTS idx_teachers_campus_active
ON public.teachers(campus_id, employment_status)
WHERE employment_status = 'active';

-- Find teacher by user_id
CREATE INDEX IF NOT EXISTS idx_teachers_user
ON public.teachers(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: CLASSES & SUBJECTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Classes per campus and academic year
CREATE INDEX IF NOT EXISTS idx_classes_campus_year
ON public.classes(campus_id, academic_year);

-- Find classes by teacher
CREATE INDEX IF NOT EXISTS idx_classes_teacher
ON public.classes(class_teacher_id)
WHERE class_teacher_id IS NOT NULL;

-- Search classes by name
CREATE INDEX IF NOT EXISTS idx_classes_search
ON public.classes(organization_id, name, section);

-- Class-subject assignments with teacher
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher
ON public.class_subjects(teacher_id, class_id)
WHERE teacher_id IS NOT NULL;

-- Subjects per campus
CREATE INDEX IF NOT EXISTS idx_subjects_campus
ON public.subjects(campus_id)
WHERE campus_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: ATTENDANCE
-- ─────────────────────────────────────────────────────────────────────────────

-- Daily attendance per class (most common query)
CREATE INDEX IF NOT EXISTS idx_attendance_class_date
ON public.attendance(class_id, date DESC);

-- Student attendance history
CREATE INDEX IF NOT EXISTS idx_attendance_student_date
ON public.attendance(student_id, date DESC);

-- Attendance by campus and date (for campus-wide reports)
CREATE INDEX IF NOT EXISTS idx_attendance_campus_date
ON public.attendance(campus_id, date DESC);

-- Recent absences (for alerts)
CREATE INDEX IF NOT EXISTS idx_attendance_absences
ON public.attendance(student_id, date DESC, status)
WHERE status IN ('absent', 'leave');

-- Attendance marked by specific teacher
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by
ON public.attendance(marked_by, date DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: ASSIGNMENTS & SUBMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Assignments per class (ordered by deadline)
CREATE INDEX IF NOT EXISTS idx_assignments_class_deadline
ON public.assignments(class_id, deadline DESC);

-- Assignments by teacher
CREATE INDEX IF NOT EXISTS idx_assignments_teacher
ON public.assignments(teacher_id, created_at DESC);

-- Upcoming assignments (for dashboard widgets)
CREATE INDEX IF NOT EXISTS idx_assignments_upcoming
ON public.assignments(deadline)
WHERE deadline > NOW();

-- Pending submissions (for teacher grading queue)
CREATE INDEX IF NOT EXISTS idx_submissions_pending
ON public.assignment_submissions(assignment_id, status)
WHERE status IN ('submitted', 'late');

-- Student submission history
CREATE INDEX IF NOT EXISTS idx_submissions_student
ON public.assignment_submissions(student_id, submitted_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9: EXAMS, MARKS, REPORT CARDS
-- ─────────────────────────────────────────────────────────────────────────────

-- Exams per organization and year
CREATE INDEX IF NOT EXISTS idx_exams_org_year
ON public.exams(organization_id, academic_year, start_date DESC);

-- Upcoming exams
CREATE INDEX IF NOT EXISTS idx_exams_upcoming
ON public.exams(start_date)
WHERE start_date > NOW();

-- Exam subjects per class
CREATE INDEX IF NOT EXISTS idx_exam_subjects_class
ON public.exam_subjects(class_id, exam_date);

-- Marks per student (for report card generation)
CREATE INDEX IF NOT EXISTS idx_marks_student
ON public.marks(student_id, exam_subject_id);

-- Marks entry per exam subject (for teacher marks entry page)
CREATE INDEX IF NOT EXISTS idx_marks_exam_subject
ON public.marks(exam_subject_id, student_id);

-- Unverified marks (for admin verification queue)
CREATE INDEX IF NOT EXISTS idx_marks_unverified
ON public.marks(exam_subject_id, verified_by)
WHERE verified_by IS NULL;

-- Published report cards per exam
CREATE INDEX IF NOT EXISTS idx_report_cards_exam_published
ON public.report_cards(exam_id, status)
WHERE status = 'published';

-- Student report cards history
CREATE INDEX IF NOT EXISTS idx_report_cards_student
ON public.report_cards(student_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10: TIMETABLE
-- ─────────────────────────────────────────────────────────────────────────────

-- Timetable per class (ordered by day and period)
CREATE INDEX IF NOT EXISTS idx_timetable_class
ON public.timetable(class_id, academic_year, day_of_week, period_number);

-- Teacher's timetable
CREATE INDEX IF NOT EXISTS idx_timetable_teacher
ON public.timetable(teacher_id, day_of_week, start_time)
WHERE teacher_id IS NOT NULL;

-- Campus-wide timetable (for clash detection)
CREATE INDEX IF NOT EXISTS idx_timetable_campus_time
ON public.timetable(campus_id, day_of_week, start_time, end_time);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 11: COMMUNICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Recent announcements per organization
CREATE INDEX IF NOT EXISTS idx_announcements_org_recent
ON public.announcements(organization_id, created_at DESC);

-- Announcements by campus
CREATE INDEX IF NOT EXISTS idx_announcements_campus
ON public.announcements(campus_id, created_at DESC)
WHERE campus_id IS NOT NULL;

-- Urgent announcements
CREATE INDEX IF NOT EXISTS idx_announcements_priority
ON public.announcements(organization_id, priority, created_at DESC)
WHERE priority IN ('high', 'urgent');

-- Unread notifications per user (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON public.notifications(user_id, created_at DESC)
WHERE is_read = FALSE;

-- Recent notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
ON public.notifications(user_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 12: HOLIDAYS & CALENDAR
-- ─────────────────────────────────────────────────────────────────────────────

-- Holidays per organization (date range queries)
CREATE INDEX IF NOT EXISTS idx_holidays_org_dates
ON public.holidays(organization_id, start_date, end_date);

-- Upcoming holidays (for dashboard)
CREATE INDEX IF NOT EXISTS idx_holidays_upcoming
ON public.holidays(start_date)
WHERE start_date >= CURRENT_DATE;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 13: GUARDIANS
-- ─────────────────────────────────────────────────────────────────────────────

-- Guardian lookup by user
CREATE INDEX IF NOT EXISTS idx_guardians_user
ON public.guardians(user_id)
WHERE user_id IS NOT NULL;

-- Student-guardian relationships
CREATE INDEX IF NOT EXISTS idx_student_guardians_student
ON public.student_guardians(student_id, is_primary);

-- Primary guardian per student
CREATE INDEX IF NOT EXISTS idx_student_guardians_primary
ON public.student_guardians(student_id, guardian_id)
WHERE is_primary = TRUE;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 14: AUTHENTICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Valid reset tokens lookup
CREATE INDEX IF NOT EXISTS idx_reset_tokens_valid
ON public.password_reset_tokens(token_hash, expires_at)
WHERE used_at IS NULL AND expires_at > NOW();

-- Valid invitations lookup
CREATE INDEX IF NOT EXISTS idx_invitations_valid
ON public.admin_invitations(token_hash, expires_at)
WHERE accepted_at IS NULL AND expires_at > NOW();

-- Invitations per organization
CREATE INDEX IF NOT EXISTS idx_invitations_org
ON public.admin_invitations(organization_id, created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════════════
-- STATISTICS UPDATE
--
-- Update table statistics for query planner
-- ═══════════════════════════════════════════════════════════════════════════════

ANALYZE public.organizations;
ANALYZE public.campuses;
ANALYZE public.profiles;
ANALYZE public.organization_members;
ANALYZE public.campus_memberships;
ANALYZE public.students;
ANALYZE public.student_enrollments;
ANALYZE public.teachers;
ANALYZE public.classes;
ANALYZE public.subjects;
ANALYZE public.attendance;
ANALYZE public.assignments;
ANALYZE public.assignment_submissions;
ANALYZE public.exams;
ANALYZE public.marks;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
--
-- Performance indexes added for:
--   ✅ Common query patterns (class lists, student lookups, attendance)
--   ✅ Search functionality (full-text search on names)
--   ✅ Dashboard widgets (unread notifications, upcoming deadlines)
--   ✅ Report generation (attendance reports, mark sheets)
--   ✅ RLS policy optimization (membership lookups)
--
-- Next: Run migration 0005_storage_buckets.sql to configure file storage
-- ═══════════════════════════════════════════════════════════════════════════════
