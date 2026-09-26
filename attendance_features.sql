-- 1. Update Attendance Status CHECK constraint
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'late', 'pending', 'rejected', 'leave', 'off_day', 'holiday'));

-- 2. Add new columns to attendance
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create weekly_off_days table
CREATE TABLE IF NOT EXISTS public.weekly_off_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    is_half_day BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, campus_id, day_of_week)
);

ALTER TABLE public.weekly_off_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage off days" ON public.weekly_off_days;
CREATE POLICY "Admins manage off days" 
ON public.weekly_off_days FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin' OR role = 'principal')
    AND school_id = public.weekly_off_days.school_id
  )
);

DROP POLICY IF EXISTS "Everyone views off days" ON public.weekly_off_days;
CREATE POLICY "Everyone views off days"
ON public.weekly_off_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = public.weekly_off_days.school_id
  )
);

-- 4. Create holidays table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage holidays" ON public.holidays;
CREATE POLICY "Admins manage holidays" 
ON public.holidays FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin' OR role = 'principal')
    AND school_id = public.holidays.school_id
  )
);

DROP POLICY IF EXISTS "Everyone views holidays" ON public.holidays;
CREATE POLICY "Everyone views holidays"
ON public.holidays FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = public.holidays.school_id
  )
);

-- 5. Expand method CHECK constraint
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_method_check;
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_method_check 
CHECK (method IN ('manual', 'qr', 'camera', 'auto', 'system'));
