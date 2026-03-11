-- Complete Database Fix: Remove clerk_user_id dependencies and constraints
-- Run this in Supabase SQL Editor

-- Step 1: Drop all foreign key constraints that depend on clerk_user_id
DO $$ 
BEGIN
    -- Drop tutors foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_tutors_profiles'
    ) THEN
        ALTER TABLE tutors DROP CONSTRAINT fk_tutors_profiles;
        RAISE NOTICE 'Dropped fk_tutors_profiles constraint';
    END IF;

    -- Drop students foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_students_profiles'
    ) THEN
        ALTER TABLE students DROP CONSTRAINT fk_students_profiles;
        RAISE NOTICE 'Dropped fk_students_profiles constraint';
    END IF;

    -- Drop parents foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parents_clerk_user_id_fkey'
    ) THEN
        ALTER TABLE parents DROP CONSTRAINT parents_clerk_user_id_fkey;
        RAISE NOTICE 'Dropped parents_clerk_user_id_fkey constraint';
    END IF;

    -- Drop tutor_onboarding_drafts foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_clerk_user'
    ) THEN
        ALTER TABLE tutor_onboarding_drafts DROP CONSTRAINT fk_clerk_user;
        RAISE NOTICE 'Dropped fk_clerk_user constraint';
    END IF;
END $$;

-- Step 2: Now drop the unique constraint on profiles.clerk_user_id
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

-- Step 3: Make clerk_user_id nullable in all tables
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
        WHERE table_name = 'students' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE students ALTER COLUMN clerk_user_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_user_id nullable in students';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE parents ALTER COLUMN clerk_user_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_user_id nullable in parents';
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

-- Step 4: Drop indexes on clerk_user_id
DROP INDEX IF EXISTS idx_profiles_clerk_user_id;
DROP INDEX IF EXISTS idx_tutors_clerk_user_id;
DROP INDEX IF EXISTS idx_students_clerk_user_id;
DROP INDEX IF EXISTS idx_parents_clerk_user_id;
DROP INDEX IF EXISTS idx_drafts_clerk_user_id;

-- Step 5: Ensure auth_user_id columns exist in all tables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to profiles';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE tutors ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to tutors';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE students ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to students';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE parents ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to parents';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutor_onboarding_drafts' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE tutor_onboarding_drafts ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id to tutor_onboarding_drafts';
    END IF;
END $$;

-- Step 6: Create indexes on auth_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_auth_user_id ON tutors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_parents_auth_user_id ON parents(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_auth_user_id ON tutor_onboarding_drafts(auth_user_id);

-- Step 7: Add unique constraint on profiles.auth_user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_auth_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);
        RAISE NOTICE 'Added unique constraint on profiles.auth_user_id';
    END IF;
END $$;

-- Step 8: Add INSERT policy for profiles (was missing!)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = auth_user_id);

-- Step 9: Update RLS policies for all tables to use auth_user_id
-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles 
    FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to profiles" ON profiles 
    FOR ALL USING (auth.role() = 'service_role');

-- Tutors
DROP POLICY IF EXISTS "Anyone can read verified tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can read own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can insert own profile" ON tutors;
DROP POLICY IF EXISTS "Service role has full access to tutors" ON tutors;

CREATE POLICY "Anyone can read verified tutors" ON tutors 
    FOR SELECT USING (is_verified = true);
CREATE POLICY "Tutors can read own profile" ON tutors 
    FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Tutors can insert own profile" ON tutors 
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Tutors can update own profile" ON tutors 
    FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to tutors" ON tutors 
    FOR ALL USING (auth.role() = 'service_role');

-- Students (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        DROP POLICY IF EXISTS "Students can read own profile" ON students;
        DROP POLICY IF EXISTS "Students can insert own profile" ON students;
        DROP POLICY IF EXISTS "Students can update own profile" ON students;
        DROP POLICY IF EXISTS "Service role has full access to students" ON students;

        CREATE POLICY "Students can read own profile" ON students 
            FOR SELECT USING (auth.uid() = auth_user_id);
        CREATE POLICY "Students can insert own profile" ON students 
            FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
        CREATE POLICY "Students can update own profile" ON students 
            FOR UPDATE USING (auth.uid() = auth_user_id);
        CREATE POLICY "Service role has full access to students" ON students 
            FOR ALL USING (auth.role() = 'service_role');
        
        RAISE NOTICE 'Updated RLS policies for students';
    END IF;
END $$;

-- Parents (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents') THEN
        DROP POLICY IF EXISTS "Parents can read own profile" ON parents;
        DROP POLICY IF EXISTS "Parents can insert own profile" ON parents;
        DROP POLICY IF EXISTS "Parents can update own profile" ON parents;
        DROP POLICY IF EXISTS "Service role has full access to parents" ON parents;

        CREATE POLICY "Parents can read own profile" ON parents 
            FOR SELECT USING (auth.uid() = auth_user_id);
        CREATE POLICY "Parents can insert own profile" ON parents 
            FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
        CREATE POLICY "Parents can update own profile" ON parents 
            FOR UPDATE USING (auth.uid() = auth_user_id);
        CREATE POLICY "Service role has full access to parents" ON parents 
            FOR ALL USING (auth.role() = 'service_role');
        
        RAISE NOTICE 'Updated RLS policies for parents';
    END IF;
END $$;

-- Drafts
DROP POLICY IF EXISTS "Users can manage own drafts" ON tutor_onboarding_drafts;
DROP POLICY IF EXISTS "Service role has full access to drafts" ON tutor_onboarding_drafts;

CREATE POLICY "Users can manage own drafts" ON tutor_onboarding_drafts 
    FOR ALL USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role has full access to drafts" ON tutor_onboarding_drafts 
    FOR ALL USING (auth.role() = 'service_role');

-- Success!
SELECT '✅ Database migration complete! clerk_user_id is now optional and auth_user_id is ready.' AS status;
