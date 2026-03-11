-- Safe Migration: Switch from Clerk to Supabase Auth
-- Copy and paste this entire file into Supabase SQL Editor

-- Step 1: Add auth_user_id columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tutor_onboarding_drafts ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_auth_user_id ON tutors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_auth_user_id ON tutor_onboarding_drafts(auth_user_id);

-- Step 3: Add unique constraint (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_auth_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;

-- Step 4: Create or replace the new user handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
        'student',
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Step 8: Drop and recreate policies for tutors
DROP POLICY IF EXISTS "Anyone can read verified tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can read own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Service role has full access to tutors" ON tutors;

CREATE POLICY "Anyone can read verified tutors" ON tutors FOR SELECT USING (is_verified = true);
CREATE POLICY "Tutors can read own profile" ON tutors FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Tutors can update own profile" ON tutors FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to tutors" ON tutors FOR ALL USING (auth.role() = 'service_role');

-- Step 9: Drop and recreate policies for drafts
DROP POLICY IF EXISTS "Users can manage own drafts" ON tutor_onboarding_drafts;
DROP POLICY IF EXISTS "Service role has full access to drafts" ON tutor_onboarding_drafts;

CREATE POLICY "Users can manage own drafts" ON tutor_onboarding_drafts FOR ALL USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to drafts" ON tutor_onboarding_drafts FOR ALL USING (auth.role() = 'service_role');

-- Step 10: Create helper function
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

-- Step 11: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Add comments
COMMENT ON COLUMN profiles.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';
COMMENT ON COLUMN tutors.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';
COMMENT ON COLUMN tutor_onboarding_drafts.auth_user_id IS 'Supabase Auth user ID (replaces clerk_user_id)';

-- Success!
SELECT 'Migration completed successfully! You can now use Supabase Auth.' AS status;
