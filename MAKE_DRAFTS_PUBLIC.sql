-- Make the drafts bucket public so images can be accessed
UPDATE storage.buckets
SET public = true
WHERE name = 'drafts';

-- Verify the bucket is now public
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'drafts';
