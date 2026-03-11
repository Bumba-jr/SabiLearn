-- Find tutors with HEIC image files
-- These files cannot be displayed in web browsers

SELECT 
    name,
    email,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE '%.heic%' THEN 'HEIC file - needs conversion'
        WHEN avatar_url LIKE '%.heif%' THEN 'HEIF file - needs conversion'
        ELSE 'OK'
    END as image_status
FROM tutors
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;

-- To fix the HEIC file issue for user 07007f0b-f51f-4ba8-8997-9cfd24447c95:
-- 
-- Option 1: Ask user to re-upload as JPEG/PNG
--   1. User goes to onboarding page
--   2. Uploads photo in JPEG or PNG format
--   3. System will automatically replace the HEIC file
--
-- Option 2: Manually convert and update (requires manual work)
--   1. Download the HEIC file from Supabase Storage
--   2. Convert to JPEG using Preview (Mac) or online tool
--   3. Upload the JPEG to storage
--   4. Update the avatar_url in database
--
-- For now, we've updated the system to reject HEIC files on new uploads
-- with a helpful error message directing users to use JPEG/PNG instead.
