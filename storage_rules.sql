-- Drop old policies just in case
DROP POLICY IF EXISTS "Public access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image." ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads" ON storage.objects;

-- Give public access to read any file
CREATE POLICY "Public access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'profiles' );

-- Give authenticated users access to upload files to 'profiles' bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'profiles' );

-- Give authenticated users access to update their files
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profiles' );

-- Give authenticated users access to delete their files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'profiles' );
