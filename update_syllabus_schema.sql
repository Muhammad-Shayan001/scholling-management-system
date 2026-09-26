-- Add completion status to syllabus chapters
ALTER TABLE public.syllabus_chapters ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
