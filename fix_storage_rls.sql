-- Fix Storage RLS Policies for Profiles Bucket
-- This script ensures that users can upload and update their own profile images

-- 1. Ensure the 'profiles' bucket is public and exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing restrictive policies to start fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to their own folder 1oj02bi_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to their own folder 1oj02bi_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to their own folder 1oj02bi_2" ON storage.objects;

-- 3. Create robust policies based on path (filename) and authentication
-- Policy: Allow public read access to all profiles
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Policy: Allow authenticated users to upload files that match their own UUID
-- This handles the case where filePath is just 'UUID.ext'
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] IS NULL AND -- Ensure it's in the root of the bucket
  (split_part(name, '.', 1)) = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (split_part(name, '.', 1)) = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (split_part(name, '.', 1)) = auth.uid()::text
);

-- 4. Add a catch-all policy for Admins to manage everything in the profiles bucket if needed
CREATE POLICY "Admins can manage all profile images"
ON storage.objects FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);
