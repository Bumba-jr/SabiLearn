-- STEP 2: Add INSERT policy for profiles
-- Copy and paste this entire file into Supabase SQL Editor

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

CREATE POLICY "Users can read own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role has full access to profiles" 
    ON profiles FOR ALL 
    USING (auth.role() = 'service_role');

SELECT 'Step 2 complete: Policies updated!' AS status;
