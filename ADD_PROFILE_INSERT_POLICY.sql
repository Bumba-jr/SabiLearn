-- Add policy to allow users to create their own profile
-- This is needed for the role selection flow

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Recreate policies with INSERT permission
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

SELECT 'Profile INSERT policy added successfully!' AS status;
