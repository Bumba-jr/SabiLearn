-- STEP 1: Remove automatic profile creation trigger
-- Copy and paste this entire file into Supabase SQL Editor

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

SELECT 'Step 1 complete: Trigger removed!' AS status;
