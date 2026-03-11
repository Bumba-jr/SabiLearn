-- Migration: Switch from Clerk to Supabase Auth
-- This migration updates the schema to use Supabase Auth instead of Clerk

-- Step 1: Add new auth_user_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index on auth_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Step 3: Make auth_user_id unique (drop first if exists)
DO $$ 
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_auth_user_id_unique;
    ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Constraint already exists, ignore
END $$;

-- Step 4: Update tutors table to add auth_user_id
ALTER TABLE tutors
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Create index on tutors auth_user_id
CREATE INDEX IF NOT EXISTS idx_tutors_auth_user_id ON tutors(auth_user_id);

-- Step 6: Update students table to add auth_user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        ALTER TABLE students
        ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
    END IF;
END $$;

-- Step 7: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO public.profiles (
        auth_user_id,
        email,
        role,
        onboarding_completed,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'student', -- Default role, will be updated during role selection
        false,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 10: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Create RLS policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access to profiles"
    ON profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 11: Enable RLS on tutors table
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

-- Step 12: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read verified tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can read own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Service role has full access to tutors" ON tutors;

-- Create RLS policies for tutors
-- Anyone can read verified tutors
CREATE POLICY "Anyone can read verified tutors"
    ON tutors
    FOR SELECT
    USING (is_verified = true);

-- Tutors can read their own profile
CREATE POLICY "Tutors can read own profile"
    ON tutors
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Tutors can update their own profile
CREATE POLICY "Tutors can update own profile"
    ON tutors
    FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to tutors"
    ON tutors
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 13: Update tutor_onboarding_drafts table
ALTER TABLE tutor_onboarding_drafts
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_drafts_auth_user_id ON tutor_onboarding_drafts(auth_user_id);

-- Step 14: Enable RLS on drafts
ALTER TABLE tutor_onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own drafts" ON tutor_onboarding_drafts;
DROP POLICY IF EXISTS "Service role has full access to drafts" ON tutor_onboarding_drafts;

-- Users can manage their own drafts
CREATE POLICY "Users can manage own drafts"
    ON tutor_onboarding_drafts
    FOR ALL
    USING (auth.uid() = auth_user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to drafts"
    ON tutor_onboarding_drafts
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 15: Add comments
COMMENT ON COLUMN profiles.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';
COMMENT ON COLUMN tutors.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';
COMMENT ON COLUMN tutor_onboarding_drafts.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';

-- Step 16: Create helper function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    onboarding_completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.role,
        p.onboarding_completed,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 17: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Note: clerk_user_id columns are kept for now to allow gradual migration
-- They can be removed later with:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS clerk_user_id;
-- ALTER TABLE tutors DROP COLUMN IF EXISTS clerk_user_id;
-- ALTER TABLE tutor_onboarding_drafts DROP COLUMN IF EXISTS clerk_user_id;
