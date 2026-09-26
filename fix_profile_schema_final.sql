-- Final Schema Fix for Profile Updates
-- This ensures all fields used in the Profile Setup form exist in the database.

-- 1. Student Profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS cnic TEXT,
ADD COLUMN IF NOT EXISTS parent_cnic TEXT,
ADD COLUMN IF NOT EXISTS student_email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS section TEXT;

-- 2. Teacher Profiles
ALTER TABLE public.teacher_profiles
ADD COLUMN IF NOT EXISTS cnic TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS subjects TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS dob DATE;

-- 3. Ensure 1-to-1 unique constraints for upserts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_user_id_key') THEN
        ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_profiles_user_id_key') THEN
        ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;
