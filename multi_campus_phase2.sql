-- 1. Enhance schools table to support campus-specific data
ALTER TABLE schools ADD COLUMN IF NOT EXISTS campus_type TEXT DEFAULT 'main';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS campus_code TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS campus_timing TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS parent_school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#6366f1';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create junction table for admins and their campuses
CREATE TABLE IF NOT EXISTS public.admin_campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, school_id)
);

-- Enable RLS on admin_campuses
ALTER TABLE public.admin_campuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view their own campus links" ON public.admin_campuses;
CREATE POLICY "Admins can view their own campus links" ON public.admin_campuses FOR SELECT USING (auth.uid() = admin_id);

-- 3. Add campus_id to core modules for strict isolation
-- (Assuming 'campuses' might actually be an alias for 'schools' in this multi-tenant model)
-- If there is no separate 'campuses' table, we use 'schools' as the reference.

DO $$ 
BEGIN
    -- For student_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'campus_id') THEN
        ALTER TABLE student_profiles ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- For teacher_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'campus_id') THEN
        ALTER TABLE teacher_profiles ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- For announcements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'campus_id') THEN
        ALTER TABLE announcements ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- For assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'campus_id') THEN
        ALTER TABLE assignments ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
    
    -- For fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'campus_id') THEN
        ALTER TABLE fees ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
    
    -- For messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'campus_id') THEN
        ALTER TABLE messages ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- For exam_schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_schedules' AND column_name = 'campus_id') THEN
        ALTER TABLE exam_schedules ADD COLUMN campus_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;
