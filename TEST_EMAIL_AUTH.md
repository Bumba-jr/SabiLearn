# Email/Password Authentication Testing Guide

## ✅ What's Fixed

1. **Profile API Route** - Now uses Supabase auth instead of Clerk
2. **Sign-in/Sign-up Pages** - Cleaned up unused Google OAuth code
3. **All Clerk references removed** - System now fully uses Supabase Auth

## 🧪 Testing Steps

### 1. Clear Browser Data (Important!)
Since you're using Brave browser:
- Press `Cmd + Shift + Delete` (or go to Settings > Privacy and security)
- Select "All time" for time range
- Check: Cookies, Cached images and files
- Click "Clear data"
- **OR** use Incognito/Private mode for testing

### 2. Test Sign Up Flow

1. Go to `http://localhost:3000/sign-up`
2. Enter a new email and password (min 6 characters)
3. Click "Create account"
4. You should be redirected to `/role-selection`
5. Select a role (Tutor, Student, or Parent)
6. Click "Continue"
7. You should be redirected to `/onboarding/{role}`

### 3. Test Sign In Flow

1. Go to `http://localhost:3000/sign-in`
2. Enter your email and password
3. Click "Sign in"
4. If you haven't completed onboarding, you'll go to `/onboarding/{role}`
5. If onboarding is complete, you'll go to `/dashboard/{role}`

### 4. Test Role Selection

1. After signing up, you should see the role selection page
2. The page should show:
   - Tutor (orange theme)
   - Student (blue theme)
   - Parent (green theme)
3. Select a role and click "Continue"
4. Profile should be created in the database

## 🔍 What to Check

### In Browser Console (F12)
Look for these logs:
```
Creating profile for user: [uuid] with role: [role]
Response status: 200
Response data: {...}
Redirecting to: /onboarding/[role]
```

### In Supabase Dashboard
1. Go to Authentication > Users
   - You should see your new user with Supabase UUID
2. Go to Table Editor > profiles
   - You should see a profile with `auth_user_id` matching your user UUID
   - `role` should be set correctly
   - `onboarding_completed` should be `false`

## 🚨 Common Issues

### Issue: "Unauthorized" error
**Solution**: Clear browser cache and cookies, then try again

### Issue: Stuck on sign-in page after signing in
**Solution**: 
1. Click "Clear all sessions" button at the top
2. Sign in again
3. If still stuck, clear browser cache completely

### Issue: "Module not found: @clerk/nextjs/server"
**Solution**: This is now fixed! Restart your dev server if you see this.

## 📝 Next Steps After Testing

1. **Create your admin account**:
   - Sign up with your email
   - Complete the onboarding flow
   - Go to `http://localhost:3000/get-admin-id`
   - Copy your Supabase UUID
   - Update `.env.local`: `ADMIN_USER_ID=your-uuid-here`
   - Restart dev server

2. **Test onboarding flows**:
   - Complete tutor onboarding
   - Complete student onboarding
   - Verify data is saved correctly

3. **Test dashboard access**:
   - After onboarding, verify you can access your dashboard
   - Try accessing wrong dashboard (should redirect to correct one)

## 🎉 Success Criteria

✅ Can sign up with email/password
✅ Can sign in with email/password
✅ Redirected to role selection after sign up
✅ Can select a role and create profile
✅ Redirected to onboarding after role selection
✅ No Clerk-related errors in console
✅ User and profile created in Supabase

## 🔧 If Something Goes Wrong

1. Check browser console for errors
2. Check terminal/dev server logs
3. Verify Supabase environment variables in `.env.local`
4. Make sure database migration was run successfully
5. Try in incognito/private mode to rule out cache issues

---

**Note**: Google OAuth has been disabled. If you want to re-enable it later, we can work on fixing the session/cookie timing issues.
