-- ─── Final Results Table ──────────────────────────────────────────────────
-- This table stores the consolidated final result for a student per term.
CREATE TABLE IF NOT EXISTS public.final_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_marks INTEGER NOT NULL,
  obtained_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  final_grade TEXT NOT NULL,
  term TEXT NOT NULL,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate final results for the same student in the same term
  UNIQUE(student_id, term)
);

-- Enable RLS
ALTER TABLE public.final_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own final results" 
ON public.final_results FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage final results" 
ON public.final_results FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
  )
);
