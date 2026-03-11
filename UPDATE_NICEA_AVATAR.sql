-- Step 1: First, let's check the tutor_onboarding_drafts table to find the file path
SELECT 
    auth_user_id,
    file_type,
    storage_path,
    original_filename,
    uploaded_at
FROM tutor_onboarding_drafts
WHERE auth_user_id = '176e7443-2bb1-437d-acf8-06f47f4f06c0'
AND file_type = 'profile_photo'
ORDER BY uploaded_at DESC
LIMIT 1;

-- Step 2: Once you see the storage_path from above, update the tutors table
-- The storage_path will look something like: "176e7443-2bb1-437d-acf8-06f47f4f06c0/profile_photo/filename.jpg"
-- 
-- Then run this UPDATE (replace [STORAGE_PATH] with the actual path from Step 1):

-- UPDATE tutors
-- SET avatar_url = 'https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/[STORAGE_PATH]'
-- WHERE id = '176e7443-2bb1-437d-acf8-06f47f4f06c0';

-- Step 3: Verify the update worked
-- SELECT id, name, avatar_url FROM tutors WHERE id = '176e7443-2bb1-437d-acf8-06f47f4f06c0';
