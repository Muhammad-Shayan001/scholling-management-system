-- ─── 1. Update Student Profiles with ID Card Fields ──────────────────────────
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;

-- Add UNIQUE constraint for roll_number within a school
-- Note: In a real multi-tenant app, uniqueness is usually school_id + roll_number
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_roll_per_school'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD CONSTRAINT unique_roll_per_school UNIQUE (school_id, roll_number);
    END IF;
END $$;

-- ─── 2. Update Teacher Profiles with ID Card Fields ──────────────────────────
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS teacher_id TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add UNIQUE constraint for teacher_id within a school
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_teacher_id_per_school'
    ) THEN
        ALTER TABLE public.teacher_profiles 
        ADD CONSTRAINT unique_teacher_id_per_school UNIQUE (school_id, teacher_id);
    END IF;
END $$;

-- ─── 3. Expand Attendance Table ───────────────────────────────────────────────
-- Drop old attendance table if it's too restrictive or just update it
-- Here we ensure it supports both students and teachers
DROP TABLE IF EXISTS public.attendance;

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('manual', 'qr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate attendance for same user on same day
  UNIQUE(user_id, date)
);

-- ─── 4. Storage Bucket for Profile Images ─────────────────────────────────────
-- Note: This is usually done in Supabase UI, but we can set up policies
-- Bucket name should be 'profiles'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'profiles' AND auth.uid() = owner);

-- ─── 5. Enable RLS on Attendance ──────────────────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance" 
ON public.attendance FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance in school" 
ON public.attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND school_id = public.attendance.school_id
  )
);

CREATE POLICY "Teachers can mark student attendance" 
ON public.attendance FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher' AND school_id = public.attendance.school_id
  )
);
