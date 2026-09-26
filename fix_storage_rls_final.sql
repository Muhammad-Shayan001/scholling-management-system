-- Final Fix for Storage RLS (Profiles Bucket)
-- This script uses a more reliable path-based check and handles upserts correctly.

-- 1. Ensure the 'profiles' bucket is public and exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all previous attempts to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all profile images" ON storage.objects;

-- 3. Policy: Public Read Access (Essential for everyone to see profile pictures)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- 4. Policy: Allow authenticated users to manage files that start with their UID
-- We use LIKE to ensure it works regardless of file extension or minor path variations
-- We apply this to ALL (INSERT, UPDATE, DELETE) to support upsert:true
CREATE POLICY "Authenticated users can manage their own files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (name LIKE auth.uid()::text || '.%')
)
WITH CHECK (
  bucket_id = 'profiles' AND 
  (name LIKE auth.uid()::text || '.%')
);

-- 5. Special Case: Allow files named exactly as the UID (no extension or handle extension differently)
CREATE POLICY "Authenticated users can manage their own files extensionless"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (name = auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'profiles' AND 
  (name = auth.uid()::text)
);

-- 6. Policy: Admins can manage everything in the profiles bucket
CREATE POLICY "Admins can manage all profile images"
ON storage.objects FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);
