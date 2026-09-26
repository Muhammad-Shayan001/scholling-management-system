-- SUPER SIMPLE STORAGE FIX
-- This script removes all restrictions and allows any logged-in user to manage the 'profiles' bucket.
-- Use this to verify if the issue is indeed RLS related.

-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear ALL policies for storage.objects to avoid any hidden blocks
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. Create a single, wide-open policy for testing
CREATE POLICY "permissive_profiles_policy"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- 4. Enable RLS (just in case it was disabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
