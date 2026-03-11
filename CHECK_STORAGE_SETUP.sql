-- Check if avatars bucket exists and is public
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'avatars';

-- If the bucket doesn't exist or isn't public, run this:
-- Make avatars bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'avatars';

-- Check storage policies for avatars bucket
SELECT 
    id,
    name,
    bucket_id,
    definition
FROM storage.policies
WHERE bucket_id = 'avatars';

-- If no public read policy exists, create one:
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
