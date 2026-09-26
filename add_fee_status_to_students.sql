-- Add fee_status column to student_profiles table
DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('paid', 'unpaid', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS fee_status fee_status NOT NULL DEFAULT 'unpaid';
