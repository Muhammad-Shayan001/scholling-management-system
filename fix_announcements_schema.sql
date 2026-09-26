-- ─── Fix Announcements Table Schema ──────────────────────────────────────────
-- This script ensures the announcements table has all columns required by the server actions.

DO $$ 
BEGIN
    -- 1. Create table if not exists with base columns
    CREATE TABLE IF NOT EXISTS public.announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 2. Add priority column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'priority') THEN
        ALTER TABLE announcements ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;

    -- 3. Add target_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_type') THEN
        ALTER TABLE announcements ADD COLUMN target_type TEXT DEFAULT 'all';
    END IF;

    -- 4. Add target_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_id') THEN
        ALTER TABLE announcements ADD COLUMN target_id TEXT;
    END IF;

    -- 5. Add attachment_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'attachment_url') THEN
        ALTER TABLE announcements ADD COLUMN attachment_url TEXT;
    END IF;

    -- 6. Add expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'expires_at') THEN
        ALTER TABLE announcements ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    -- 7. Add campus_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'campus_id') THEN
        ALTER TABLE announcements ADD COLUMN campus_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    END IF;

    -- 8. Handle author_id / created_by naming mismatch
    -- We'll standardize on 'created_by' as used in the server actions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'author_id') THEN
            ALTER TABLE announcements RENAME COLUMN author_id TO created_by;
        ELSE
            ALTER TABLE announcements ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- 9. Ensure school_id is NOT NULL
    ALTER TABLE announcements ALTER COLUMN school_id SET NOT NULL;
    
    -- 10. Ensure created_by is NOT NULL
    ALTER TABLE announcements ALTER COLUMN created_by SET NOT NULL;

END $$;

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Isolation)
DROP POLICY IF EXISTS "School-based announcement isolation" ON public.announcements;
CREATE POLICY "School-based announcement isolation" ON public.announcements 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR school_id = public.announcements.school_id)));
