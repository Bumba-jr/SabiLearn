# Fix: Database Error Saving New User

## 🔍 Problem

When signing up, you get "database error saving new user". This is caused by:

1. **Automatic profile creation trigger** - Creates a profile automatically when user signs up
2. **Role selection flow** - Tries to create a profile again when user selects role
3. **Missing INSERT policy** - Users can't insert their own profile due to RLS

## ✅ Solution

Run these SQL scripts in Supabase SQL Editor in order:

### Step 1: Remove Automatic Profile Creation

Copy and paste `FIX_SIGNUP_TRIGGER.sql` into Supabase SQL Editor and run it.

This removes the trigger that automatically creates profiles, allowing users to select their role first.

### Step 2: Add Profile INSERT Policy

Copy and paste `ADD_PROFILE_INSERT_POLICY.sql` into Supabase SQL Editor and run it.

This allows users to create their own profile when they select a role.

## 🧪 Test After Running SQL

1. **Clear browser data** (Cmd + Shift + Delete in Brave)
   - Or use Incognito/Private mode

2. **Go to sign-up page**: `http://localhost:3000/sign-up`

3. **Create a new account**:
   - Enter email and password
   - Click "Create account"
   - Should redirect to `/role-selection`

4. **Select a role**:
   - Choose Tutor, Student, or Parent
   - Click "Continue"
   - Should redirect to `/onboarding/{role}`

5. **Verify in Supabase**:
   - Go to Authentication > Users
   - You should see your user
   - Go to Table Editor > profiles
   - You should see your profile with the correct role

## 🎯 Expected Flow

```
Sign Up → Auth User Created (no profile yet)
         ↓
Role Selection → User selects role
         ↓
Profile Created → With selected role
         ↓
Onboarding → Complete profile details
```

## 🔧 Alternative: Use Service Role Key

If the above doesn't work, the profile API already uses the service role key which bypasses RLS. The issue might be something else. Check:

1. **Browser console** (F12) - Look for the actual error message
2. **Terminal/dev server logs** - Check for API errors
3. **Supabase logs** - Go to Supabase Dashboard > Logs

## 📋 What Each SQL Script Does

### FIX_SIGNUP_TRIGGER.sql
- Removes `on_auth_user_created` trigger
- Removes `handle_new_user()` function
- Prevents automatic profile creation

### ADD_PROFILE_INSERT_POLICY.sql
- Adds INSERT policy for profiles table
- Allows users to create their own profile
- Maintains security with RLS

## ⚠️ Important Notes

1. **Service Role Key**: The profile API uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS, so technically the INSERT policy isn't needed for the API. However, it's good practice to have it.

2. **Unique Constraint**: The `auth_user_id` column has a unique constraint, so users can only have one profile.

3. **Trigger Removed**: Without the trigger, profiles are ONLY created when users select a role. This is the correct flow for your app.

## 🚨 If Still Getting Errors

Share the exact error message from:
1. Browser console (F12 > Console tab)
2. Network tab (F12 > Network tab > Click on the failed request > Response)
3. Terminal where dev server is running

This will help identify the exact issue.
