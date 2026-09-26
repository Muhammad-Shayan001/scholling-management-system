-- Academy course + slot enrollment migration
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS batch_id UUID NULL,
ADD COLUMN IF NOT EXISTS course_slot TEXT NULL;

ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS is_course BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT NULL;

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS course_slot TEXT NULL;

COMMENT ON COLUMN public.student_profiles.batch_id IS 'Selected academy course/batch';
COMMENT ON COLUMN public.student_profiles.course_slot IS 'Selected time slot for the academy course';
COMMENT ON COLUMN public.attendance.course_slot IS 'Attendance linked to a specific academy course slot';
