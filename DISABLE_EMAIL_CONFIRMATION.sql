-- Disable email confirmation for development
-- This allows users to sign in immediately after signing up
-- Run this in Supabase SQL Editor

-- Note: This is a Supabase setting, not a SQL command
-- You need to change this in the Supabase Dashboard

-- Go to: Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"

-- Alternatively, you can confirm users manually in SQL:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com';

SELECT 'Go to Supabase Dashboard > Authentication > Settings > Email Auth and disable "Enable email confirmations"' AS instruction;
