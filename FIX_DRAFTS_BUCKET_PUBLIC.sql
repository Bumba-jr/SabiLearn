-- Check current bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('drafts', 'avatars');

-- Make drafts bucket public (if it's not already)
UPDATE storage.buckets
SET public = true
WHERE name = 'drafts';

-- Add RLS policy to allow public read access to drafts bucket
-- First, check if policy exists
SELECT * FROM storage.policies WHERE bucket_id = 'drafts';

-- Create policy for public read access if it doesn't exist
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
    'Public read access for drafts',
    'drafts',
    'SELECT',
    'true'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Verify the changes
SELECT id, name, public
FROM storage.buckets
WHERE name = 'drafts';
