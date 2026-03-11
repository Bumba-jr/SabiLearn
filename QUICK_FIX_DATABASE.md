# Quick Fix - Database Schema Issue

## The Problem
```
Error: null value in column "clerk_user_id" of relation "profiles" violates not-null constraint
```

The database still requires the old `clerk_user_id` column, but we're using `auth_user_id` now.

## The Solution (2 minutes)

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp/sql
- Or: Dashboard → SQL Editor → New query

### 2. Copy and Run This SQL
Open `FIX_CLERK_COLUMN.sql` and copy ALL the contents, then paste and run in Supabase.

### 3. Test
1. Clear browser storage
2. Sign up at `http://localhost:3000/sign-up`
3. Select a role
4. Should work! ✅

## What the SQL Does
- Makes `clerk_user_id` optional (removes NOT NULL)
- Adds missing INSERT policy for profiles
- Keeps the column for safety (can delete later)

## That's It!
After running the SQL, your auth flow should work perfectly.
