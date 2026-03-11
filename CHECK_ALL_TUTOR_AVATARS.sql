-- Check avatar URLs for all tutors
SELECT 
    id,
    name,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN '❌ No avatar'
        WHEN avatar_url LIKE 'http%' THEN '✅ Full URL'
        ELSE '⚠️ Relative path'
    END as status
FROM tutors
ORDER BY created_at DESC;
