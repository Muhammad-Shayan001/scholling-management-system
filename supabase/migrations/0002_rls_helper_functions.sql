-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0002: RLS HELPER FUNCTIONS
--
-- This migration creates secure helper functions used by RLS policies.
-- These functions provide a clean, tested interface for permission checks.
--
-- SECURITY NOTE: All functions use SECURITY INVOKER (not DEFINER) to prevent
-- privilege escalation. They operate with the permissions of the calling user.
--
-- Version: 1.0
-- Date: 2026-09-26
-- Dependencies: 0001_baseline_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: current_user_id()
-- Returns the authenticated user's UUID from auth.uid()
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.current_user_id() IS 'Returns authenticated user UUID';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: is_platform_admin()
-- Returns TRUE if current user is a super_admin (platform administrator)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND is_active = TRUE
    );
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS 'Check if user is platform super admin';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: is_org_member(org_id UUID)
-- Returns TRUE if current user belongs to the specified organization
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
$$;

COMMENT ON FUNCTION public.is_org_member(UUID) IS 'Check if user is active member of organization';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: user_organizations()
-- Returns array of organization IDs the current user belongs to
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT ARRAY_AGG(organization_id)
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND status = 'active';
$$;

COMMENT ON FUNCTION public.user_organizations() IS 'Returns array of org IDs user belongs to';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: can_access_campus(org_id UUID, campus_id UUID)
-- Returns TRUE if user can access the specified campus
-- Platform admins can access all campuses; others must have explicit membership
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_access_campus(org_id UUID, campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT (
        -- Platform admins can access all campuses
        public.is_platform_admin()
        OR
        -- User must be org member AND have campus membership
        (
            public.is_org_member(org_id)
            AND EXISTS (
                SELECT 1
                FROM public.campus_memberships
                WHERE campus_memberships.organization_id = org_id
                AND campus_memberships.campus_id = can_access_campus.campus_id
                AND campus_memberships.user_id = auth.uid()
            )
        )
    );
$$;

COMMENT ON FUNCTION public.can_access_campus(UUID, UUID) IS 'Check if user can access specific campus';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: user_role()
-- Returns the current user's primary role
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.user_role() IS 'Returns authenticated user primary role';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: is_teacher_of_class(class_id UUID)
-- Returns TRUE if current user is a teacher assigned to the specified class
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_teacher_of_class(class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        -- Class teacher
        SELECT 1
        FROM public.classes
        WHERE classes.id = is_teacher_of_class.class_id
        AND classes.class_teacher_id = auth.uid()
    ) OR EXISTS (
        -- Subject teacher for this class
        SELECT 1
        FROM public.class_subjects
        WHERE class_subjects.class_id = is_teacher_of_class.class_id
        AND class_subjects.teacher_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.is_teacher_of_class(UUID) IS 'Check if user teaches the specified class';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: is_student_in_class(class_id UUID)
-- Returns TRUE if current user is enrolled in the specified class
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_student_in_class(class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.student_enrollments se ON se.student_id = s.id
        WHERE s.user_id = auth.uid()
        AND se.class_id = is_student_in_class.class_id
        AND se.status = 'active'
    );
$$;

COMMENT ON FUNCTION public.is_student_in_class(UUID) IS 'Check if user is enrolled in the specified class';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: is_guardian_of_student(student_id UUID)
-- Returns TRUE if current user is a guardian of the specified student
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_guardian_of_student(student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.guardians g
        JOIN public.student_guardians sg ON sg.guardian_id = g.id
        WHERE g.user_id = auth.uid()
        AND sg.student_id = is_guardian_of_student.student_id
    );
$$;

COMMENT ON FUNCTION public.is_guardian_of_student(UUID) IS 'Check if user is guardian of student';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: user_student_id()
-- Returns the student record ID for the current user (if they are a student)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT id
    FROM public.students
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.user_student_id() IS 'Returns student ID for current user';


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: can_manage_organization(org_id UUID)
-- Returns TRUE if user can manage the organization (admin or platform admin)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_manage_organization(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT (
        public.is_platform_admin()
        OR
        (
            public.is_org_member(org_id)
            AND public.user_role() IN ('admin')
        )
    );
$$;

COMMENT ON FUNCTION public.can_manage_organization(UUID) IS 'Check if user can manage organization';


-- ═══════════════════════════════════════════════════════════════════════════════
-- TESTS: Verify helper functions work correctly
-- These are sample tests - run manually after migration
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test current_user_id() returns a UUID
-- SELECT public.current_user_id();

-- Test is_platform_admin() for super_admin user
-- SELECT public.is_platform_admin();

-- Test is_org_member() with a valid org ID
-- SELECT public.is_org_member('org-uuid-here');

-- Test user_organizations() returns array
-- SELECT public.user_organizations();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
--
-- Next: Run migration 0003_rls_policies.sql to apply these helpers to RLS policies
-- ═══════════════════════════════════════════════════════════════════════════════
