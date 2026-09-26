-- Migration: RBAC (Role-Based Access Control) Tables
-- Description: Roles, permissions, and role assignments for fine-grained access control
-- Created: 2026-09-26

-- =====================================================
-- ROLES TABLE
-- =====================================================
-- Defines both system roles (super_admin, admin, etc.) and custom organization roles

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- System roles have null organization_id, custom roles belong to an org
    CONSTRAINT unique_system_role_slug UNIQUE NULLS NOT DISTINCT (organization_id, slug),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9_]+$'),
    CONSTRAINT system_roles_no_org CHECK (
        (is_system_role = true AND organization_id IS NULL) OR
        (is_system_role = false AND organization_id IS NOT NULL)
    )
);

CREATE INDEX idx_roles_organization ON public.roles(organization_id);
CREATE INDEX idx_roles_slug ON public.roles(slug);
CREATE INDEX idx_roles_system ON public.roles(is_system_role) WHERE is_system_role = true;

COMMENT ON TABLE public.roles IS 'System and organization-specific roles';
COMMENT ON COLUMN public.roles.is_system_role IS 'true for built-in roles (super_admin, admin, etc.), false for custom org roles';
COMMENT ON COLUMN public.roles.slug IS 'Machine-readable identifier (lowercase, underscores only)';

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
-- Granular permissions that can be assigned to roles

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_permission UNIQUE (resource, action),
    CONSTRAINT valid_resource CHECK (resource ~ '^[a-z_]+$'),
    CONSTRAINT valid_action CHECK (action IN ('create', 'read', 'update', 'delete', 'manage'))
);

CREATE INDEX idx_permissions_resource ON public.permissions(resource);

COMMENT ON TABLE public.permissions IS 'Granular permissions for resource actions';
COMMENT ON COLUMN public.permissions.resource IS 'Resource name (e.g., students, classes, assignments)';
COMMENT ON COLUMN public.permissions.action IS 'Action type: create, read, update, delete, manage';

-- =====================================================
-- ROLE_PERMISSIONS JUNCTION TABLE
-- =====================================================
-- Maps which permissions each role has

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles';

-- =====================================================
-- MEMBER_ROLES TABLE
-- =====================================================
-- Assigns roles to organization members (profiles)

CREATE TABLE IF NOT EXISTS public.member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A user can have multiple roles in an org (e.g., teacher + admin)
    -- But each role assignment is unique
    CONSTRAINT unique_member_role UNIQUE (organization_id, user_id, role_id, campus_id),

    -- Ensure role belongs to same org (or is system role)
    CONSTRAINT role_org_match CHECK (
        EXISTS (
            SELECT 1 FROM public.roles r
            WHERE r.id = role_id
            AND (r.organization_id = member_roles.organization_id OR r.is_system_role = true)
        )
    )
);

CREATE INDEX idx_member_roles_org ON public.member_roles(organization_id);
CREATE INDEX idx_member_roles_user ON public.member_roles(user_id);
CREATE INDEX idx_member_roles_role ON public.member_roles(role_id);
CREATE INDEX idx_member_roles_campus ON public.member_roles(campus_id);
CREATE INDEX idx_member_roles_user_org ON public.member_roles(user_id, organization_id);

COMMENT ON TABLE public.member_roles IS 'Assigns roles to users within organizations';
COMMENT ON COLUMN public.member_roles.campus_id IS 'Optional: scope role to specific campus (null = all campuses)';

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED SYSTEM ROLES
-- =====================================================

INSERT INTO public.roles (name, slug, description, is_system_role) VALUES
    ('Super Admin', 'super_admin', 'Platform administrator with full access to all organizations', true),
    ('Organization Admin', 'admin', 'Full access to organization and all campuses', true),
    ('Teacher', 'teacher', 'Can manage classes, assignments, and grades', true),
    ('Student', 'student', 'Can view classes, submit assignments, and check grades', true),
    ('Parent', 'parent', 'Can view children''s progress and communicate with teachers', true),
    ('Campus Admin', 'campus_admin', 'Manages a specific campus within an organization', true),
    ('Librarian', 'librarian', 'Manages library resources and book checkouts', true),
    ('Accountant', 'accountant', 'Manages fees, payments, and financial records', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED PERMISSIONS
-- =====================================================

INSERT INTO public.permissions (resource, action, description) VALUES
    -- Organizations
    ('organizations', 'read', 'View organization details'),
    ('organizations', 'update', 'Edit organization settings'),
    ('organizations', 'delete', 'Delete organization'),
    ('organizations', 'manage', 'Full organization management'),

    -- Campuses
    ('campuses', 'create', 'Create new campus'),
    ('campuses', 'read', 'View campus details'),
    ('campuses', 'update', 'Edit campus information'),
    ('campuses', 'delete', 'Delete campus'),
    ('campuses', 'manage', 'Full campus management'),

    -- Students
    ('students', 'create', 'Add new students'),
    ('students', 'read', 'View student profiles'),
    ('students', 'update', 'Edit student information'),
    ('students', 'delete', 'Remove students'),
    ('students', 'manage', 'Full student management'),

    -- Teachers
    ('teachers', 'create', 'Add new teachers'),
    ('teachers', 'read', 'View teacher profiles'),
    ('teachers', 'update', 'Edit teacher information'),
    ('teachers', 'delete', 'Remove teachers'),
    ('teachers', 'manage', 'Full teacher management'),

    -- Classes
    ('classes', 'create', 'Create new classes'),
    ('classes', 'read', 'View class details'),
    ('classes', 'update', 'Edit class information'),
    ('classes', 'delete', 'Delete classes'),
    ('classes', 'manage', 'Full class management'),

    -- Subjects
    ('subjects', 'create', 'Create subjects'),
    ('subjects', 'read', 'View subjects'),
    ('subjects', 'update', 'Edit subjects'),
    ('subjects', 'delete', 'Delete subjects'),

    -- Assignments
    ('assignments', 'create', 'Create assignments'),
    ('assignments', 'read', 'View assignments'),
    ('assignments', 'update', 'Edit assignments'),
    ('assignments', 'delete', 'Delete assignments'),

    -- Attendance
    ('attendance', 'create', 'Mark attendance'),
    ('attendance', 'read', 'View attendance records'),
    ('attendance', 'update', 'Edit attendance'),
    ('attendance', 'delete', 'Delete attendance records'),

    -- Exams
    ('exams', 'create', 'Create exams'),
    ('exams', 'read', 'View exams'),
    ('exams', 'update', 'Edit exams'),
    ('exams', 'delete', 'Delete exams'),

    -- Marks
    ('marks', 'create', 'Enter marks'),
    ('marks', 'read', 'View marks'),
    ('marks', 'update', 'Edit marks'),
    ('marks', 'delete', 'Delete marks'),

    -- Report Cards
    ('report_cards', 'create', 'Generate report cards'),
    ('report_cards', 'read', 'View report cards'),
    ('report_cards', 'update', 'Edit report cards'),
    ('report_cards', 'delete', 'Delete report cards'),

    -- Fees
    ('fees', 'create', 'Create fee structures'),
    ('fees', 'read', 'View fees'),
    ('fees', 'update', 'Edit fees'),
    ('fees', 'delete', 'Delete fees'),

    -- Payments
    ('payments', 'create', 'Record payments'),
    ('payments', 'read', 'View payment history'),
    ('payments', 'update', 'Edit payments'),
    ('payments', 'delete', 'Delete payments'),

    -- Invoices
    ('invoices', 'create', 'Generate invoices'),
    ('invoices', 'read', 'View invoices'),
    ('invoices', 'update', 'Edit invoices'),
    ('invoices', 'delete', 'Delete invoices'),

    -- Announcements
    ('announcements', 'create', 'Create announcements'),
    ('announcements', 'read', 'View announcements'),
    ('announcements', 'update', 'Edit announcements'),
    ('announcements', 'delete', 'Delete announcements'),

    -- Notifications
    ('notifications', 'create', 'Send notifications'),
    ('notifications', 'read', 'View notifications'),

    -- Timetable
    ('timetable', 'create', 'Create timetables'),
    ('timetable', 'read', 'View timetables'),
    ('timetable', 'update', 'Edit timetables'),
    ('timetable', 'delete', 'Delete timetables'),

    -- Members (organization users)
    ('members', 'create', 'Invite members'),
    ('members', 'read', 'View members'),
    ('members', 'update', 'Edit member roles'),
    ('members', 'delete', 'Remove members'),
    ('members', 'manage', 'Full member management'),

    -- Roles (RBAC management)
    ('roles', 'create', 'Create custom roles'),
    ('roles', 'read', 'View roles'),
    ('roles', 'update', 'Edit roles'),
    ('roles', 'delete', 'Delete roles'),
    ('roles', 'manage', 'Full role management')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED ROLE PERMISSIONS
-- =====================================================

-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin gets all permissions except platform-level
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Teacher permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'teacher'
AND p.resource IN ('classes', 'students', 'assignments', 'attendance', 'exams', 'marks', 'report_cards', 'announcements', 'timetable')
AND p.action IN ('read', 'create', 'update')
ON CONFLICT DO NOTHING;

-- Student permissions (read-only for most)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'student'
AND (
    (p.resource IN ('classes', 'assignments', 'exams', 'marks', 'report_cards', 'timetable', 'announcements') AND p.action = 'read')
    OR (p.resource = 'assignments' AND p.action IN ('create', 'update')) -- Can submit assignments
)
ON CONFLICT DO NOTHING;

-- Parent permissions (read-only)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'parent'
AND p.resource IN ('students', 'classes', 'assignments', 'exams', 'marks', 'report_cards', 'attendance', 'announcements', 'fees', 'payments', 'invoices')
AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Campus Admin permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'campus_admin'
AND p.resource IN ('students', 'teachers', 'classes', 'subjects', 'assignments', 'attendance', 'exams', 'marks', 'report_cards', 'timetable', 'announcements')
ON CONFLICT DO NOTHING;

-- Accountant permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'accountant'
AND p.resource IN ('fees', 'payments', 'invoices', 'students')
ON CONFLICT DO NOTHING;

-- Librarian permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'librarian'
AND p.resource IN ('students', 'teachers')
AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;

-- Roles: Super admins see all, org admins see their org's roles + system roles
CREATE POLICY "super_admin_view_all_roles"
ON public.roles FOR SELECT TO authenticated
USING (public.is_platform_admin());

CREATE POLICY "org_admin_view_roles"
ON public.roles FOR SELECT TO authenticated
USING (
    is_system_role = true
    OR public.can_manage_organization(organization_id)
);

CREATE POLICY "org_admin_create_custom_roles"
ON public.roles FOR INSERT TO authenticated
WITH CHECK (
    is_system_role = false
    AND public.can_manage_organization(organization_id)
);

CREATE POLICY "org_admin_update_custom_roles"
ON public.roles FOR UPDATE TO authenticated
USING (
    is_system_role = false
    AND public.can_manage_organization(organization_id)
);

CREATE POLICY "org_admin_delete_custom_roles"
ON public.roles FOR DELETE TO authenticated
USING (
    is_system_role = false
    AND public.can_manage_organization(organization_id)
);

-- Permissions: Everyone can view (needed for UI)
CREATE POLICY "authenticated_view_permissions"
ON public.permissions FOR SELECT TO authenticated
USING (true);

-- Role Permissions: Same as roles (for now, simplify to view-all)
CREATE POLICY "authenticated_view_role_permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "super_admin_manage_role_permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Member Roles: Users see their own, admins see their org
CREATE POLICY "users_view_own_roles"
ON public.member_roles FOR SELECT TO authenticated
USING (user_id = public.current_user_id());

CREATE POLICY "org_admin_view_member_roles"
ON public.member_roles FOR SELECT TO authenticated
USING (public.can_manage_organization(organization_id));

CREATE POLICY "org_admin_assign_roles"
ON public.member_roles FOR INSERT TO authenticated
WITH CHECK (public.can_manage_organization(organization_id));

CREATE POLICY "org_admin_remove_roles"
ON public.member_roles FOR DELETE TO authenticated
USING (public.can_manage_organization(organization_id));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_organization_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.member_roles mr
        JOIN public.role_permissions rp ON rp.role_id = mr.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE mr.user_id = public.current_user_id()
        AND mr.organization_id = p_organization_id
        AND p.resource = p_resource
        AND (p.action = p_action OR p.action = 'manage')
    );
END;
$$;

COMMENT ON FUNCTION public.user_has_permission IS 'Check if current user has specific permission in organization';

-- Get all user permissions for an organization
CREATE OR REPLACE FUNCTION public.user_permissions(
    p_organization_id UUID
)
RETURNS TABLE (
    resource TEXT,
    action TEXT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT DISTINCT p.resource, p.action
    FROM public.member_roles mr
    JOIN public.role_permissions rp ON rp.role_id = mr.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE mr.user_id = public.current_user_id()
    AND mr.organization_id = p_organization_id;
$$;

COMMENT ON FUNCTION public.user_permissions IS 'Get all permissions for current user in organization';

-- Get user roles in organization
CREATE OR REPLACE FUNCTION public.user_roles_in_org(
    p_organization_id UUID
)
RETURNS TABLE (
    role_id UUID,
    role_slug TEXT,
    role_name TEXT,
    campus_id UUID
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT r.id, r.slug, r.name, mr.campus_id
    FROM public.member_roles mr
    JOIN public.roles r ON r.id = mr.role_id
    WHERE mr.user_id = public.current_user_id()
    AND mr.organization_id = p_organization_id;
$$;

COMMENT ON FUNCTION public.user_roles_in_org IS 'Get current user''s roles in organization';

-- Run ANALYZE for query planner
ANALYZE public.roles;
ANALYZE public.permissions;
ANALYZE public.role_permissions;
ANALYZE public.member_roles;
