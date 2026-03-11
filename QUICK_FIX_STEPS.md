# Quick Fix: Database Error on Sign Up

## 🚀 Do These Steps NOW

### 1. Run SQL Scripts in Supabase

Go to your Supabase Dashboard → SQL Editor

**First, run this** (copy ONLY the SQL below, NOT the ```sql markers):

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

SELECT 'Trigger removed!' AS status;

**Then, run this** (copy ONLY the SQL below, NOT the ```sql markers):

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

SELECT 'Policies updated!' AS status;

### 2. Restart Your Dev Server

In your terminal:
```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm dev
```

### 3. Clear Browser Cache

In Brave browser:
- Press `Cmd + Shift + Delete`
- Select "All time"
- Check: Cookies, Cached images
- Click "Clear data"

**OR** just use Incognito/Private mode

### 4. Test Sign Up Again

1. Go to `http://localhost:3000/sign-up`
2. Enter email and password
3. Click "Create account"
4. Should redirect to role selection
5. Select a role
6. Click "Continue"

### 5. Check Logs

**In Browser Console (F12):**
Look for these logs:
```
Profile API - User ID: [uuid]
Profile API - Auth User ID from body: [uuid]
Profile API - Role: [role]
Profile API - Creating new profile...
Profile API - New profile: {...}
```

**In Terminal:**
Look for any errors from the API route

## ✅ What This Fixes

1. **Removes automatic profile creation** - No more conflicts
2. **Adds INSERT permission** - Users can create their own profile
3. **Better logging** - See exactly what's happening

## 🔍 If Still Getting Errors

Check the browser console and terminal for the detailed error message. The new logging will show:
- User ID
- Auth User ID from request
- Role being set
- Any database errors with details

Share those logs and I can help further!
