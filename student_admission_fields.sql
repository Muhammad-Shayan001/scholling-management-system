-- ─── Advanced Student Admission Fields ───────────────────────────────────────
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS registration_no TEXT,
ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS fee_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_phone TEXT,
ADD COLUMN IF NOT EXISTS birth_form_id TEXT,
ADD COLUMN IF NOT EXISTS is_orphan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS student_cast TEXT,
ADD COLUMN IF NOT EXISTS is_osc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS id_mark TEXT,
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS family_id TEXT,
ADD COLUMN IF NOT EXISTS disease TEXT,
ADD COLUMN IF NOT EXISTS additional_note TEXT,
ADD COLUMN IF NOT EXISTS total_siblings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS father_cnic TEXT,
ADD COLUMN IF NOT EXISTS father_occupation TEXT,
ADD COLUMN IF NOT EXISTS father_education TEXT,
ADD COLUMN IF NOT EXISTS father_phone TEXT,
ADD COLUMN IF NOT EXISTS father_profession TEXT,
ADD COLUMN IF NOT EXISTS father_income TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mother_cnic TEXT,
ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS mother_education TEXT,
ADD COLUMN IF NOT EXISTS mother_phone TEXT,
ADD COLUMN IF NOT EXISTS mother_profession TEXT,
ADD COLUMN IF NOT EXISTS mother_income TEXT;

-- Update RLS for student_profiles to ensure consistency
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School-based student isolation" ON public.student_profiles;
CREATE POLICY "School-based student isolation" ON public.student_profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.student_profiles.school_id)
  )
);
