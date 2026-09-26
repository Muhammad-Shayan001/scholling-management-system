-- Create Exam Schedules Table
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Examination',
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  room TEXT,
  term TEXT DEFAULT 'Final Term',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Allow reading for everyone authenticated
DROP POLICY IF EXISTS "Anyone authenticated can view exams" ON public.exam_schedules;
CREATE POLICY "Anyone authenticated can view exams" ON public.exam_schedules FOR SELECT TO authenticated USING (true);

-- Allow admins and teachers to manage exams
DROP POLICY IF EXISTS "Admins and teachers can manage exams" ON public.exam_schedules;
CREATE POLICY "Admins and teachers can manage exams" ON public.exam_schedules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin' OR role = 'teacher')
  )
);
