-- ============================================================
-- REQUIRED MIGRATION: Run this SQL in Supabase Dashboard 
-- Go to: https://supabase.com/dashboard → SQL Editor
-- ============================================================

-- Step 1: Add batch_id column to student_profiles
-- This links a student to a specific batch/course in an academy
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS batch_id UUID NULL;

-- Step 2: Add is_course flag to subjects table
-- This marks a subject as a "course" (academy offering)
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS is_course BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Add description to subjects
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- Step 4 (optional): Add FK constraint linking batch_id to subjects
-- ALTER TABLE public.student_profiles
-- ADD CONSTRAINT fk_student_batch FOREIGN KEY (batch_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Verify columns were added:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('student_profiles', 'subjects')
  AND column_name IN ('batch_id', 'is_course', 'description')
ORDER BY table_name, column_name;
