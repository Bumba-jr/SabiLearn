-- Verify all required columns exist in tutors table
-- Run this in Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutors'
ORDER BY ordinal_position;

-- Expected columns (should include):
-- - auth_user_id (uuid)
-- - user_id (text)
-- - name (text)
-- - email (text)
-- - phone (text)
-- - bio (text)
-- - subjects (jsonb)
-- - grade_levels (jsonb)
-- - hourly_rate (numeric)
-- - location (text)
-- - avatar_url (text)
-- - intro_video_url (text)
-- - degree_certificate_url (text) -- NEW
-- - government_id_url (text) -- NEW
-- - nysc_certificate_url (text) -- NEW
-- - experience_level (text)
-- - experiences (jsonb)
-- - bank_name (text)
-- - account_number (text)
-- - account_name (text)
-- - is_verified (boolean)
-- - is_available (boolean)
-- - rating (numeric)
-- - total_reviews (integer)
-- - created_at (timestamp)
-- - updated_at (timestamp)
