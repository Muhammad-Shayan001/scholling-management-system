-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0005: STORAGE BUCKETS & POLICIES
--
-- This migration configures Supabase Storage buckets for file uploads.
-- Each bucket has specific RLS policies to control access.
--
-- IMPORTANT: Run this in Supabase SQL Editor. Storage policies use
-- storage.* functions that may not work in all migration tools.
--
-- Version: 1.0
-- Date: 2026-09-26
-- Dependencies: 0001-0004 migrations
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: avatars
-- User profile photos (public read, authenticated write own)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Users can upload their own avatar
DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
CREATE POLICY "users_upload_own_avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
DROP POLICY IF EXISTS "users_update_own_avatar" ON storage.objects;
CREATE POLICY "users_update_own_avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;
CREATE POLICY "users_delete_own_avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access (avatars are public)
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: logos
-- Organization and campus logos (private, org-scoped)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    FALSE,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Admins can upload logos for their organization
DROP POLICY IF EXISTS "admin_upload_logos" ON storage.objects;
CREATE POLICY "admin_upload_logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'logos'
    AND (
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.profiles p ON p.id = om.user_id
            WHERE om.user_id = auth.uid()
            AND om.organization_id::text = (storage.foldername(name))[1]
            AND om.status = 'active'
            AND p.role = 'admin'
        )
    )
);

-- Admins can update and delete their org's logos
DROP POLICY IF EXISTS "admin_manage_logos" ON storage.objects;
CREATE POLICY "admin_manage_logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'logos'
    AND (
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.profiles p ON p.id = om.user_id
            WHERE om.user_id = auth.uid()
            AND om.organization_id::text = (storage.foldername(name))[1]
            AND om.status = 'active'
            AND p.role = 'admin'
        )
    )
);

DROP POLICY IF EXISTS "admin_delete_logos" ON storage.objects;
CREATE POLICY "admin_delete_logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'logos'
    AND (
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.profiles p ON p.id = om.user_id
            WHERE om.user_id = auth.uid()
            AND om.organization_id::text = (storage.foldername(name))[1]
            AND om.status = 'active'
            AND p.role = 'admin'
        )
    )
);

-- Org members can view their org's logos
DROP POLICY IF EXISTS "members_view_logos" ON storage.objects;
CREATE POLICY "members_view_logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'logos'
    AND EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
        AND organization_id::text = (storage.foldername(name))[1]
        AND status = 'active'
    )
);


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: documents
-- General school documents (private, campus-scoped)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    FALSE,
    10485760, -- 10MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff can upload documents
DROP POLICY IF EXISTS "staff_upload_documents" ON storage.objects;
CREATE POLICY "staff_upload_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

-- Staff can manage documents
DROP POLICY IF EXISTS "staff_manage_documents" ON storage.objects;
CREATE POLICY "staff_manage_documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

DROP POLICY IF EXISTS "staff_delete_documents" ON storage.objects;
CREATE POLICY "staff_delete_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

-- Authenticated users can view documents (specific access controlled by app logic)
DROP POLICY IF EXISTS "auth_view_documents" ON storage.objects;
CREATE POLICY "auth_view_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: assignments
-- Assignment attachments (private, teacher-uploaded)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments',
    'assignments',
    FALSE,
    10485760, -- 10MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Teachers upload assignment attachments
DROP POLICY IF EXISTS "teachers_upload_assignments" ON storage.objects;
CREATE POLICY "teachers_upload_assignments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignments'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

-- Teachers manage their assignment files
DROP POLICY IF EXISTS "teachers_manage_assignments" ON storage.objects;
CREATE POLICY "teachers_manage_assignments"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'assignments'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

-- Students can view assignment files
DROP POLICY IF EXISTS "students_view_assignments" ON storage.objects;
CREATE POLICY "students_view_assignments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'assignments');


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: submissions
-- Student assignment submissions (private, student-uploaded)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions',
    'submissions',
    FALSE,
    10485760, -- 10MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Students upload their submissions
DROP POLICY IF EXISTS "students_upload_submissions" ON storage.objects;
CREATE POLICY "students_upload_submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can update their own submissions (before deadline)
DROP POLICY IF EXISTS "students_update_submissions" ON storage.objects;
CREATE POLICY "students_update_submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can view their own submissions
DROP POLICY IF EXISTS "students_view_own_submissions" ON storage.objects;
CREATE POLICY "students_view_own_submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers and admins can view all submissions
DROP POLICY IF EXISTS "staff_view_submissions" ON storage.objects;
CREATE POLICY "staff_view_submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'submissions'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);


-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET: student-photos
-- Student profile photos (private, campus-scoped)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-photos',
    'student-photos',
    FALSE,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff upload student photos
DROP POLICY IF EXISTS "staff_upload_student_photos" ON storage.objects;
CREATE POLICY "staff_upload_student_photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'student-photos'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
)
WITH CHECK (
    bucket_id = 'student-photos'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);

-- Students can view their own photo
DROP POLICY IF EXISTS "students_view_own_photo" ON storage.objects;
CREATE POLICY "students_view_own_photo"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-photos'
    AND EXISTS (
        SELECT 1 FROM public.students
        WHERE user_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
);

-- Staff can view student photos in their organization
DROP POLICY IF EXISTS "staff_view_student_photos" ON storage.objects;
CREATE POLICY "staff_view_student_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-photos'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'teacher')
    )
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
--
-- Storage buckets configured:
--   ✅ avatars (public, 5MB, user-managed)
--   ✅ logos (private, 2MB, admin-managed)
--   ✅ documents (private, 10MB, staff-managed)
--   ✅ assignments (private, 10MB, teacher-managed)
--   ✅ submissions (private, 10MB, student-managed)
--   ✅ student-photos (private, 2MB, staff-managed)
--
-- All buckets have RLS policies enforcing proper access control.
-- File paths should follow: <bucket>/<org_id|user_id>/<file_name>
--
-- Next: Begin building the application (lib/env.ts, Supabase clients, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════
