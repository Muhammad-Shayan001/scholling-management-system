-- ============================================================
-- FIX: Create Missing final_results Table
-- Run this script in your Supabase SQL Editor (New Query)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.final_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  total_marks NUMERIC NOT NULL DEFAULT 0,
  obtained_marks NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_grade TEXT NOT NULL DEFAULT 'F',
  term TEXT NOT NULL DEFAULT 'Final Term',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, term)
);

-- Enable RLS
ALTER TABLE public.final_results ENABLE ROW LEVEL SECURITY;

-- Add simple policies
DROP POLICY IF EXISTS "Public read final_results" ON public.final_results;
CREATE POLICY "Public read final_results" ON public.final_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "All write final_results" ON public.final_results;
CREATE POLICY "All write final_results" ON public.final_results FOR ALL USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
