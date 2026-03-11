-- Fix: Remove automatic profile creation trigger
-- This allows users to select their role before creating a profile

-- Drop the trigger that automatically creates profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now profiles will only be created when users select their role
-- This is the correct flow for our application

SELECT 'Trigger removed successfully! Users can now sign up without automatic profile creation.' AS status;
