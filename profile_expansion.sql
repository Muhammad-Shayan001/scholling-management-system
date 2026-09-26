-- ─── 1. Add missing Student fields ──────────────────────────────
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A',
ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;

-- ─── 2. Add missing Teacher fields ──────────────────────────────
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS subjects TEXT, -- String summary of subjects
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- Ensure is_class_teacher and class_id are usable
-- (They were already in the initial schema)
