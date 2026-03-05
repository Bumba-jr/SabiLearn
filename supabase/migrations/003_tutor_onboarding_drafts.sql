-- Migration: Tutor Onboarding Draft Storage
-- Description: Create table and policies for storing draft file uploads during tutor onboarding

-- ============================================================================
-- 1. CREATE TUTOR_ONBOARDING_DRAFTS TABLE
-- ============================================================================

CREATE TABLE tutor_onboarding_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (
    file_type IN (
      'degree_certificate',
      'government_id',
      'nysc_certificate',
      'profile_photo',
      'intro_video'
    )
  ),
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Constraints
  CONSTRAINT unique_user_file_type UNIQUE (clerk_user_id, file_type),
  CONSTRAINT fk_clerk_user FOREIGN KEY (clerk_user_id) 
    REFERENCES profiles(clerk_user_id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Index for efficient user queries
CREATE INDEX idx_drafts_clerk_user_id ON tutor_onboarding_drafts(clerk_user_id);

-- Index for efficient cleanup queries
CREATE INDEX idx_drafts_expires_at ON tutor_onboarding_drafts(expires_at);

-- Index for file type queries
CREATE INDEX idx_drafts_file_type ON tutor_onboarding_drafts(file_type);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tutor_onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Note: Since we're using Clerk authentication (not Supabase Auth),
-- and the API uses the service role key which bypasses RLS,
-- we create permissive policies that allow service role access.
--
-- Security is enforced at the API layer:
-- 1. Clerk authentication verifies user identity
-- 2. API routes validate user ID matches authenticated user
-- 3. Service role key allows API to manage data on behalf of users

-- Policy: Allow service role to manage all drafts
-- (Service role bypasses RLS, but this makes intent clear)
CREATE POLICY "Service role can manage all drafts" ON tutor_onboarding_drafts
  FOR ALL USING (true) WITH CHECK (true);
