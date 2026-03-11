-- Fix Nicea nia's avatar URL by finding it in the drafts bucket
-- Run this in Supabase SQL Editor

-- First, let's see what files exist in the drafts bucket for this user
-- You'll need to check the Storage section in Supabase dashboard
-- Navigate to: Storage > drafts > [user_id] > profile_photo

-- Once you find the file, update the avatar_url
-- Replace [USER_ID] and [FILENAME] with actual values from Storage

-- Example:
-- UPDATE tutors
-- SET avatar_url = 'https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/[USER_ID]/profile_photo/[FILENAME]'
-- WHERE name = 'Nicea nia';

-- To find the user_id for Nicea nia:
SELECT 
    t.id,
    t.name,
    t.auth_user_id,
    t.avatar_url,
    p.auth_user_id as profile_auth_user_id
FROM tutors t
LEFT JOIN profiles p ON t.auth_user_id = p.auth_user_id
WHERE t.name = 'Nicea nia';

-- After finding the file in Storage, run:
-- UPDATE tutors
-- SET avatar_url = 'https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/[FULL_PATH_TO_FILE]'
-- WHERE name = 'Nicea nia';

-- Verify the update:
SELECT id, name, avatar_url
FROM tutors
WHERE name = 'Nicea nia';
