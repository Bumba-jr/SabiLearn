-- Check avatar URLs in the tutors table
SELECT 
    id,
    name,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN 'NULL'
        WHEN avatar_url LIKE 'http%' THEN 'Full URL'
        WHEN avatar_url LIKE 'avatars/%' THEN 'Relative path with bucket'
        ELSE 'Just filename'
    END as url_type
FROM tutors
WHERE avatar_url IS NOT NULL
LIMIT 10;
