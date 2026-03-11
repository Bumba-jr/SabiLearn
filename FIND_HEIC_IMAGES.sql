-- Find all tutors with HEIC/HEIF images
-- Run this in Supabase SQL Editor to see which images need conversion

SELECT 
    id,
    auth_user_id,
    name,
    email,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE '%.heic%' THEN 'HEIC - needs conversion'
        WHEN avatar_url LIKE '%.heif%' THEN 'HEIF - needs conversion'
        ELSE 'Other format'
    END as image_status,
    created_at
FROM tutors
WHERE avatar_url IS NOT NULL
  AND (avatar_url LIKE '%.heic%' OR avatar_url LIKE '%.heif%')
ORDER BY created_at DESC;

-- Summary count
SELECT 
    COUNT(*) as total_heic_images,
    COUNT(DISTINCT auth_user_id) as affected_tutors
FROM tutors
WHERE avatar_url IS NOT NULL
  AND (avatar_url LIKE '%.heic%' OR avatar_url LIKE '%.heif%');

-- All image formats breakdown
SELECT 
    CASE 
        WHEN avatar_url LIKE '%.jpg%' OR avatar_url LIKE '%.jpeg%' THEN 'JPEG'
        WHEN avatar_url LIKE '%.png%' THEN 'PNG'
        WHEN avatar_url LIKE '%.heic%' THEN 'HEIC (needs conversion)'
        WHEN avatar_url LIKE '%.heif%' THEN 'HEIF (needs conversion)'
        WHEN avatar_url LIKE '%.webp%' THEN 'WebP'
        WHEN avatar_url LIKE '%.gif%' THEN 'GIF'
        WHEN avatar_url IS NULL THEN 'No image'
        ELSE 'Unknown format'
    END as format,
    COUNT(*) as count
FROM tutors
GROUP BY format
ORDER BY count DESC;
