-- Ensure 1-to-1 relationship constraints for profile tables
-- This allows 'upsert' operations to work correctly based on the user_id

DO $$ BEGIN
    -- Student Profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'student_profiles' AND indexname = 'student_profiles_user_id_key'
    ) THEN
        ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);
    END IF;

    -- Teacher Profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'teacher_profiles' AND indexname = 'teacher_profiles_user_id_key'
    ) THEN
        ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_user_id_key UNIQUE (user_id);
    END IF;

    -- Admins (if applicable)
    -- Check if admins table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'admins' AND indexname = 'admins_user_id_key'
        ) THEN
            ALTER TABLE public.admins ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;
