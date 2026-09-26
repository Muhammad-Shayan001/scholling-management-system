-- Add batch_id column to student_profiles for Academy course/batch enrollment
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS batch_id UUID NULL;

-- Add is_course column to subjects table if it doesn't exist
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS is_course BOOLEAN NOT NULL DEFAULT false;

-- Add description column to subjects table if it doesn't exist
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- Update existing subjects seeded as courses for academies (optional - only if you want to mark all as courses)
-- UPDATE public.subjects SET is_course = true WHERE description IS NOT NULL;

SELECT 'batch_id column added to student_profiles' as status;
SELECT 'is_course column added to subjects' as status;
