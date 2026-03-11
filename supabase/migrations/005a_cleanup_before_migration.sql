-- Cleanup script to run before the main migration
-- This removes any existing policies that might conflict

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Drop all existing policies on tutors
DROP POLICY IF EXISTS "Anyone can read verified tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can read own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Service role has full access to tutors" ON tutors;

-- Drop all existing policies on tutor_onboarding_drafts
DROP POLICY IF EXISTS "Users can manage own drafts" ON tutor_onboarding_drafts;
DROP POLICY IF EXISTS "Service role has full access to drafts" ON tutor_onboarding_drafts;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_current_user_profile();

-- Now you can run the main migration: 005_migrate_to_supabase_auth.sql
