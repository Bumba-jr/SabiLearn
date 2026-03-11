-- First, check the current column type
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tutors' 
AND column_name = 'avatar_url';

-- Increase the avatar_url column length to handle long URLs
ALTER TABLE tutors 
ALTER COLUMN avatar_url TYPE TEXT;

-- Now let's find the actual file in storage
SELECT 
    name,
    bucket_id,
    created_at
FROM storage.objects
WHERE name LIKE '%8295fb7d-7572-4dbb-9840-40d8da749df1%'
AND name LIKE '%profile_photo%'
ORDER BY created_at DESC
LIMIT 5;

-- Update the avatar_url to point to the drafts bucket
-- Replace with the actual path from the query above
UPDATE tutors
SET avatar_url = 'https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/8295fb7d-7572-4dbb-9840-40d8da749df1/profile_photo/1772922736458_236b1bff4ac1c1dfd652f24ab7886876.jpg'
WHERE auth_user_id = '8295fb7d-7572-4dbb-9840-40d8da749df1';

-- Verify the update
SELECT 
    id,
    name,
    avatar_url,
    auth_user_id
FROM tutors
WHERE auth_user_id = '8295fb7d-7572-4dbb-9840-40d8da749df1';
