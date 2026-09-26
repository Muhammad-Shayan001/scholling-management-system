-- 1. Create Teacher Assignments Table (Crucial for the mapping)
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(user_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, class_id)
);

-- 2. Create Final Results Table (Crucial for Class Teacher Merging)
CREATE TABLE IF NOT EXISTS public.final_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  total_marks DECIMAL(7,2) NOT NULL,
  obtained_marks DECIMAL(7,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  final_grade TEXT,
  remarks TEXT,
  term TEXT DEFAULT 'Final Term',
  published_by UUID REFERENCES public.teacher_profiles(user_id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, term)
);

-- 3. Enable RLS and Add Policies to prevent blocking
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read assignments" ON public.teacher_assignments;
CREATE POLICY "Public read assignments" ON public.teacher_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write assignments" ON public.teacher_assignments;
CREATE POLICY "All write assignments" ON public.teacher_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read final_results" ON public.final_results;
CREATE POLICY "Public read final_results" ON public.final_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write final_results" ON public.final_results;
CREATE POLICY "All write final_results" ON public.final_results FOR ALL USING (true);
