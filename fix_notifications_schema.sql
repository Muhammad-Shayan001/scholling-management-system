-- Fix Notifications Schema
-- Adds the missing columns that the backend is trying to insert into

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS attendance_id UUID,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attendance_status TEXT;
