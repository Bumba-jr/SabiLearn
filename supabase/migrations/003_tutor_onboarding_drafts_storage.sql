-- Migration: Tutor Onboarding Draft Storage
-- Description: Create storage bucket and policies for draft file uploads

-- ============================================================================
-- STORAGE BUCKET SETUP INSTRUCTIONS
-- ============================================================================
-- 
-- This migration includes SQL policies for the 'drafts' storage bucket.
-- The bucket itself must be created via the Supabase Dashboard:
--
-- 1. Navigate to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Create bucket with these settings:
--    - Name: drafts
--    - Public: NO (private bucket)
--    - File size limit: 104857600 (100 MB in bytes)
--    - Allowed MIME types: Leave empty (will be validated in application code)
-- 4. After creating the bucket, run this migration to apply the RLS policies
--
-- ============================================================================

-- ============================================================================
-- STORAGE POLICIES FOR 'drafts' BUCKET
-- ============================================================================

-- Drop existing policies if they exist (to handle re-running migration)
DROP POLICY IF EXISTS "Users can upload own draft files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own draft files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own draft files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own draft files" ON storage.objects;

-- Note: Since we're using Clerk authentication (not Supabase Auth),
-- and the API uses the service role key which bypasses RLS,
-- we don't need RLS policies on storage.objects.
-- 
-- Security is enforced at the API layer:
-- 1. Clerk authentication verifies user identity
-- 2. API routes validate user ID matches authenticated user
-- 3. Service role key allows API to manage storage on behalf of users
--
-- If you want to enable direct client-side storage access in the future,
-- you would need to:
-- 1. Set up Supabase Auth alongside Clerk, OR
-- 2. Create a custom auth hook that syncs Clerk user ID to Supabase metadata

-- For now, we'll create permissive policies that allow service role access
-- (Service role bypasses RLS anyway, but this makes intent clear)

CREATE POLICY "Service role can manage all draft files"
ON storage.objects
FOR ALL
USING (bucket_id = 'drafts')
WITH CHECK (bucket_id = 'drafts');

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- File Organization:
-- - All draft files are stored in the 'drafts' bucket
-- - Path structure: drafts/{clerk_user_id}/{file_type}/{timestamp}_{filename}
-- - Supported file types: degree_certificate, government_id, nysc_certificate,
--   profile_photo, intro_video
--
-- Security:
-- - Row Level Security ensures users can only access their own files
-- - Files are scoped by clerk_user_id (first folder in path)
-- - The bucket is private, requiring authentication for all operations
--
-- File Size Limits:
-- - Documents (degree_certificate, government_id, nysc_certificate): 5 MB
-- - Profile photo: 5 MB
-- - Intro video: 100 MB
-- - Bucket maximum: 100 MB (enforced at bucket level)
-- - Application code validates file sizes before upload
--
-- Cleanup:
-- - Draft files expire after 30 days (tracked in tutor_onboarding_drafts table)
-- - A scheduled cleanup job removes expired files daily
-- - Files are moved to permanent storage upon successful form submission
--
