-- Fix: Remove clerk_user_id column and constraints
-- Run this in Supabase SQL Editor

-- Step 1: Make clerk_user_id nullable (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE profiles ALTER COLUMN clerk_user_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_user_id nullable in profiles';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE tutors ALTER COLUMN clerk_user_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_user_id nullable in tutors';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutor_onboarding_drafts' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE tutor_onboarding_drafts ALTER COLUMN clerk_user_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_user_id nullable in tutor_onboarding_drafts';
    END IF;
END $$;

-- Step 2: Drop unique constraints on clerk_user_id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_clerk_user_id_key'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_clerk_user_id_key;
        RAISE NOTICE 'Dropped unique constraint on profiles.clerk_user_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tutors_clerk_user_id_key'
    ) THEN
        ALTER TABLE tutors DROP CONSTRAINT tutors_clerk_user_id_key;
        RAISE NOTICE 'Dropped unique constraint on tutors.clerk_user_id';
    END IF;
END $$;

-- Step 3: Drop indexes on clerk_user_id
DROP INDEX IF EXISTS idx_profiles_clerk_user_id;
DROP INDEX IF EXISTS idx_tutors_clerk_user_id;
DROP INDEX IF EXISTS idx_drafts_clerk_user_id;

-- Step 4: Eventually drop the columns (optional - uncomment when ready)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS clerk_user_id;
-- ALTER TABLE tutors DROP COLUMN IF EXISTS clerk_user_id;
-- ALTER TABLE tutor_onboarding_drafts DROP COLUMN IF EXISTS clerk_user_id;

-- Step 5: Verify auth_user_id is set up correctly
DO $$ 
BEGIN
    -- Make sure auth_user_id exists and is nullable for now
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to profiles';
    END IF;
END $$;

-- Step 6: Add INSERT policy for profiles (was missing!)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = auth_user_id);

-- Success!
SELECT 'Fixed! clerk_user_id is now nullable and auth_user_id is ready to use.' AS status;
