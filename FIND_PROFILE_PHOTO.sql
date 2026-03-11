-- Find where the profile photo actually is stored
SELECT 
    name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE name LIKE '%8295fb7d-7572-4dbb-9840-40d8da749df1%'
ORDER BY created_at DESC;

-- Check what's in the tutors table
SELECT 
    id,
    name,
    avatar_url,
    auth_user_id
FROM tutors
WHERE auth_user_id = '8295fb7d-7572-4dbb-9840-40d8da749df1';
