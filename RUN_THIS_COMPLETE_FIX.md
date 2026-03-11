# 🚨 COMPLETE DATABASE FIX

## The Error
```
cannot drop constraint profiles_clerk_user_id_key on table profiles because other objects depend on it
```

This means other tables (tutors, students, parents, drafts) have foreign keys pointing to `clerk_user_id`.

## The Solution

### Step 1: Open Supabase SQL Editor
https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp/sql

### Step 2: Run the Complete Fix
1. Open `COMPLETE_DATABASE_FIX.sql` in your project
2. Copy ALL the contents (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor (Cmd+V)
4. Click "Run" (or Cmd+Enter)
5. Wait ~5 seconds

### Step 3: Verify Success
You should see:
```
✅ Database migration complete! clerk_user_id is now optional and auth_user_id is ready.
```

### Step 4: Test Your App
1. Clear browser storage (DevTools → Application → Clear storage)
2. Go to `http://localhost:3000/sign-up`
3. Sign up with a new email
4. Select a role
5. Click "Continue"
6. ✅ Should work perfectly!

## What This Script Does

1. Drops all foreign key constraints that depend on `clerk_user_id`
2. Drops the unique constraint on `clerk_user_id`
3. Makes `clerk_user_id` nullable in all tables
4. Ensures `auth_user_id` exists in all tables
5. Creates indexes on `auth_user_id`
6. Updates all RLS policies to use `auth_user_id`
7. Adds missing INSERT policy for profiles

## After This

Your complete auth flow will work:
- Sign up → Select role → Onboarding → Dashboard
- All three roles (tutor, student, parent)
- Profile creation and updates
- Session management

## Need Help?

If you still get errors:
1. Share the exact error message
2. Check Supabase Dashboard → Logs → Postgres Logs
3. Visit `/test-session` to check your session
