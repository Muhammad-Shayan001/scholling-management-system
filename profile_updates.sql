CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  school_id uuid REFERENCES public.schools ON DELETE CASCADE,
  cnic text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic text;

ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS cnic text;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS teacher_id text UNIQUE;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id);

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS cnic text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS roll_number text UNIQUE;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_phone text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS parent_cnic text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS student_email text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS address text;
