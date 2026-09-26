-- Create custom student groups table (admin-managed)
CREATE TABLE IF NOT EXISTS public.custom_student_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(school_id, group_name),
  CONSTRAINT group_name_not_empty CHECK (group_name != '')
);

-- Create index for faster lookups
CREATE INDEX idx_custom_groups_school_id ON public.custom_student_groups(school_id);
CREATE INDEX idx_custom_groups_created_by ON public.custom_student_groups(created_by);

-- Enable RLS
ALTER TABLE public.custom_student_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage custom groups for their school
CREATE POLICY "Admins can manage custom groups"
  ON public.custom_student_groups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.id = auth.uid()
      AND a.school_id = custom_student_groups.school_id
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.id = auth.uid()
      AND a.school_id = custom_student_groups.school_id
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.id = auth.uid()
    )
  );

-- RLS Policy: Students can view custom groups for their school
CREATE POLICY "Students can view custom groups"
  ON public.custom_student_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students st
      JOIN public.classes c ON st.class_id = c.id
      WHERE st.id = auth.uid()
      AND c.school_id = custom_student_groups.school_id
    )
  );

-- RLS Policy: Teachers can view custom groups for their school
CREATE POLICY "Teachers can view custom groups"
  ON public.custom_student_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = auth.uid()
      AND t.school_id = custom_student_groups.school_id
    )
  );
