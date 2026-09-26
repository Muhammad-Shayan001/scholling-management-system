-- Harmonize Database Schema for Profile Management System

-- 1. Ensure profiles table is ready
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL, -- super_admin, admin, teacher, student, parent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create/Update Students Table (formerly student_profiles)
-- We will use IF NOT EXISTS for the table, but we might need to add columns
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  class_id UUID, -- reference to classes(id)
  section TEXT,
  dob DATE,
  gender TEXT,
  student_email TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  school_id UUID,
  admin_approved BOOLEAN DEFAULT false,
  teacher_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create/Update Teachers Table (formerly teacher_profiles)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id TEXT UNIQUE,
  subjects TEXT, -- stored as comma-separated or JSON
  is_class_teacher BOOLEAN DEFAULT false,
  class_id UUID, -- if they are a class teacher
  qualification TEXT,
  experience TEXT,
  address TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS and Policies (Simplified for now, but following standard patterns)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Migration: If student_profiles exists, copy data to students
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_profiles') THEN
    INSERT INTO public.students (user_id, class_id, parent_name, parent_phone, school_id, admin_approved, teacher_approved, created_at)
    SELECT user_id, class_id, parent_name, parent_phone, school_id, admin_approved, teacher_approved, created_at
    FROM public.student_profiles
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teacher_profiles') THEN
    INSERT INTO public.teachers (user_id, is_class_teacher, class_id, school_id, created_at)
    SELECT user_id, is_class_teacher, class_id, school_id, created_at
    FROM public.teacher_profiles
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
