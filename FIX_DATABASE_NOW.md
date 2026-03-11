# Fix Database Schema - URGENT

## Problem
The database still has the old `clerk_user_id` column with a NOT NULL constraint. This is preventing profile creation.

## Solution
Run the SQL script to remove the constraint and set up the database correctly for Supabase Auth.

## Steps

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `vgmflkoykskpqxryrdsp`
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### 2. Run the Fix Script
1. Open the file `FIX_CLERK_COLUMN.sql` in this project
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click "Run" or press Cmd+Enter

### 3. Verify Success
You should see:
```
Fixed! clerk_user_id is now nullable and auth_user_id is ready to use.
```

### 4. Test the App
1. Clear browser storage (DevTools → Application → Clear storage)
2. Go to `http://localhost:3000/sign-up`
3. Sign up with a new email
4. Select a role
5. Click "Continue"
6. Should work without errors!

## What This Script Does

1. Makes `clerk_user_id` nullable (removes NOT NULL constraint)
2. Drops unique constraints on `clerk_user_id`
3. Drops indexes on `clerk_user_id`
4. Ensures `auth_user_id` column exists
5. Adds missing INSERT policy for profiles
6. Keeps `clerk_user_id` column for now (can be deleted later)

## Why This Happened

The original migration script (`RUN_AUTH_MIGRATION.sql`) added the new `auth_user_id` column but didn't remove the NOT NULL constraint from `clerk_user_id`. This caused the database to require BOTH columns, which broke profile creation.

## After This Works

Once profile creation works:
1. Test all three roles (tutor, student, parent)
2. Test the onboarding flow
3. Later, you can remove the `clerk_user_id` column completely by uncommenting Step 4 in the SQL script

## If Still Having Issues

Check the Supabase logs:
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for any errors related to profiles table
4. Share the error message for further help
