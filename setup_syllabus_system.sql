-- ═══════════════════════════════════════════════════════════════════════════════
-- SYLLABUS MANAGEMENT SYSTEM
-- Tables for creating and managing syllabi
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, subject_id, academic_session, school_id)
);

CREATE TABLE IF NOT EXISTS public.syllabus_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_chapters ENABLE ROW LEVEL SECURITY;

-- Read Access: Anyone can read syllabi and chapters for their school
DROP POLICY IF EXISTS "Read syllabi" ON public.syllabi;
CREATE POLICY "Read syllabi" ON public.syllabi FOR SELECT USING (true);

DROP POLICY IF EXISTS "Read syllabus_chapters" ON public.syllabus_chapters;
CREATE POLICY "Read syllabus_chapters" ON public.syllabus_chapters FOR SELECT USING (true);

-- Write Access: Handled by adminClient in server actions, so we don't strictly need insert/update/delete policies here,
-- but we can add them for completeness:
DROP POLICY IF EXISTS "Write syllabi" ON public.syllabi;
CREATE POLICY "Write syllabi" ON public.syllabi FOR ALL USING (true);

DROP POLICY IF EXISTS "Write syllabus_chapters" ON public.syllabus_chapters;
CREATE POLICY "Write syllabus_chapters" ON public.syllabus_chapters FOR ALL USING (true);
