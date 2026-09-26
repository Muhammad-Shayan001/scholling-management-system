CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  text_answer TEXT,
  marks NUMERIC(5,2),
  feedback TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'late', 'graded')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_marks NUMERIC(5,2);
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
