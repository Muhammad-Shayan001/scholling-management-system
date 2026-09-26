-- Create import_logs table to track bulk student imports
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    imported_by UUID NOT NULL REFERENCES public.profiles(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    total_records INTEGER NOT NULL DEFAULT 0,
    successful_imports INTEGER NOT NULL DEFAULT 0,
    failed_imports INTEGER NOT NULL DEFAULT 0,
    duplicate_records INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    details JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view their own school's import logs" 
    ON public.import_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'super_admin' OR profiles.school_id = import_logs.school_id)
        )
    );

CREATE POLICY "Admins can insert import logs" 
    ON public.import_logs FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'super_admin' OR profiles.role = 'admin')
        )
    );
