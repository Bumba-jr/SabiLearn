-- Migration: Authentication and Onboarding Schema
-- Description: Add profiles, parents, onboarding_progress tables and extend existing tables

-- ============================================================================
-- 1. CREATE PROFILES TABLE (Central authentication table)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tutor', 'student', 'parent')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. EXTEND TUTORS TABLE
-- ============================================================================

-- Add clerk_user_id and onboarding fields to tutors
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert'));
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS grade_levels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS credentials_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;

-- Add foreign key to profiles
ALTER TABLE tutors ADD CONSTRAINT fk_tutors_profiles 
  FOREIGN KEY (clerk_user_id) REFERENCES profiles(clerk_user_id) ON DELETE CASCADE;

-- Add index on grade_levels
CREATE INDEX idx_tutors_grade_levels ON tutors USING GIN (grade_levels);

-- ============================================================================
-- 3. EXTEND STUDENTS TABLE
-- ============================================================================

-- Add clerk_user_id and onboarding fields to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS subjects_needed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_goals TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_mode TEXT CHECK (preferred_mode IN ('online', 'home', 'both'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE;

-- Add foreign key to profiles
ALTER TABLE students ADD CONSTRAINT fk_students_profiles 
  FOREIGN KEY (clerk_user_id) REFERENCES profiles(clerk_user_id) ON DELETE CASCADE;

-- Add index on subjects_needed
CREATE INDEX idx_students_subjects_needed ON students USING GIN (subjects_needed);

-- Add constraint for parent info when is_minor
ALTER TABLE students ADD CONSTRAINT parent_info_required CHECK (
  NOT is_minor OR (
    parent_name IS NOT NULL AND 
    parent_email IS NOT NULL AND 
    parent_phone IS NOT NULL
  )
);

-- ============================================================================
-- 4. CREATE PARENTS TABLE
-- ============================================================================

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Child Information
  child_name TEXT NOT NULL,
  child_grade_level TEXT NOT NULL,
  subjects_needed JSONB DEFAULT '[]'::jsonb NOT NULL,
  
  -- Preferences
  preferred_schedule TEXT NOT NULL,
  location TEXT NOT NULL,
  preferred_mode TEXT NOT NULL CHECK (preferred_mode IN ('online', 'home', 'both')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parents
CREATE INDEX idx_parents_clerk_user_id ON parents(clerk_user_id);
CREATE INDEX idx_parents_child_grade_level ON parents(child_grade_level);
CREATE INDEX idx_parents_subjects_needed ON parents USING GIN (subjects_needed);

-- Updated_at trigger for parents
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CREATE ONBOARDING_PROGRESS TABLE
-- ============================================================================

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tutor', 'student', 'parent')),
  form_data JSONB DEFAULT '{}'::jsonb,
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for onboarding_progress
CREATE INDEX idx_onboarding_progress_clerk_user_id ON onboarding_progress(clerk_user_id);

-- ============================================================================
-- 6. DATABASE TRIGGERS
-- ============================================================================

-- Trigger: Prevent role changes after onboarding completion
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.onboarding_completed = TRUE AND NEW.role != OLD.role THEN
    RAISE EXCEPTION 'Cannot change role after onboarding completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_role_lock
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_change();

-- Trigger: Auto-delete onboarding progress after completion
CREATE OR REPLACE FUNCTION delete_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_completed = TRUE THEN
    DELETE FROM onboarding_progress WHERE clerk_user_id = NEW.clerk_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_onboarding_progress
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION delete_onboarding_progress();

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own incomplete profile" ON profiles
  FOR UPDATE USING (
    auth.uid()::text = clerk_user_id AND 
    onboarding_completed = FALSE
  );

-- Tutors RLS Policies (update existing)
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;

CREATE POLICY "Tutors can insert own profile" ON tutors
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Tutors can update own profile" ON tutors
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Students RLS Policies (update existing)
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;

CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Students can insert own profile" ON students
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Students can update own profile" ON students
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Parents RLS Policies
CREATE POLICY "Parents can view own profile" ON parents
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Parents can insert own profile" ON parents
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Parents can update own profile" ON parents
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Onboarding Progress RLS Policies
CREATE POLICY "Users can manage own progress" ON onboarding_progress
  FOR ALL USING (auth.uid()::text = clerk_user_id);

-- ============================================================================
-- 8. STORAGE BUCKETS (Run these in Supabase Dashboard Storage section)
-- ============================================================================

-- Note: Storage buckets must be created via Supabase Dashboard or Storage API
-- After creating buckets (avatars, videos, credentials), apply these policies:

-- Avatars bucket policies (public):
-- CREATE POLICY "Users can upload own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
-- 
-- CREATE POLICY "Avatars are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- Videos bucket policies (public):
-- CREATE POLICY "Users can upload own video" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'videos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
-- 
-- CREATE POLICY "Videos are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'videos');

-- Credentials bucket policies (private):
-- CREATE POLICY "Users can upload own credentials" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'credentials' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
-- 
-- CREATE POLICY "Users can view own credentials" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'credentials' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

