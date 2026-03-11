# Fix Unauthorized Error - Step by Step

## What I Fixed

1. **Added better session checking** in `app/role-selection/page.tsx`:
   - Now checks if session exists before making API call
   - Shows detailed console logs to debug the issue
   - Redirects to sign-in if no user is found

2. **Added authentication guard** to role-selection page:
   - Checks if user is authenticated before showing the page
   - Shows loading state while checking auth
   - Redirects to sign-in if not authenticated

3. **Fixed profile API** (`app/api/profile/route.ts`):
   - Cleaned up syntax errors
   - File is now working correctly

4. **Created test page** at `/test-session`:
   - Visit `http://localhost:3000/test-session` to see your session info
   - This will help debug if the session is being stored correctly

## Testing Steps

### Step 1: Clear Browser Data
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all storage:
   - Local Storage
   - Session Storage
   - Cookies
4. Refresh the page

### Step 2: Sign Up Fresh
1. Go to `http://localhost:3000/sign-up`
2. Create a new account with email/password
3. Watch the console for any errors
4. You should be redirected to `/role-selection`

### Step 3: Check Session
1. Go to `http://localhost:3000/test-session`
2. You should see:
   - `hasUser: true`
   - `hasSession: true`
   - `hasAccessToken: true`
   - Your user ID and email

If any of these are false, the session isn't being stored correctly.

### Step 4: Select Role
1. Go to `http://localhost:3000/role-selection`
2. Select a role (tutor/student/parent)
3. Click "Continue"
4. Watch the console for detailed logs:
   - "Creating profile for user: [user-id] with role: [role]"
   - "Session check: { hasSession: true, hasAccessToken: true }"
   - "Sending request with token: [token-preview]..."
   - "Response status: 200" (should be 200, not 401)

## If Still Getting 401 Error

### Check 1: Session Storage
Open DevTools → Application → Local Storage → `http://localhost:3000`

Look for keys starting with `sb-vgmflkoykskpqxryrdsp-auth-token`

If missing, the session isn't being stored. This could be because:
- Browser is blocking cookies/storage
- Incognito mode
- Browser extension interfering

### Check 2: Token Validation
The console should show "Sending request with token: [first 20 chars]..."

If you see this but still get 401, the token might be invalid. Try:
1. Sign out completely
2. Clear all storage
3. Sign up again

### Check 3: API Route
Test the API directly:
1. Go to `/test-session` and copy the access token
2. Open a new tab and open DevTools Console
3. Run this code (replace YOUR_TOKEN and YOUR_USER_ID):

```javascript
fetch('/api/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    authUserId: 'YOUR_USER_ID',
    role: 'student'
  })
}).then(r => r.json()).then(console.log)
```

If this works, the API is fine and the issue is with how the token is being sent from the role-selection page.

## Common Issues

### Issue: "No active session. Please sign in again."
**Solution**: The session expired or wasn't created. Sign out and sign in again.

### Issue: "Multiple GoTrueClient instances detected"
**Solution**: This is just a warning, not an error. It won't affect functionality.

### Issue: Still getting 401 after all steps
**Solution**: 
1. Check if email confirmation is disabled in Supabase Dashboard
2. Go to Authentication → Settings → Email Auth
3. Make sure "Enable email confirmations" is OFF
4. Try signing up with a different email

## Next Steps After This Works

Once role selection works:
1. Test the onboarding flow for each role
2. Configure Google OAuth (see `SETUP_GOOGLE_OAUTH.md`)
3. Test the complete flow: Sign up → Select role → Complete onboarding → Dashboard

## Need More Help?

If you're still stuck, share:
1. Console output from `/test-session`
2. Console output when clicking "Continue" on role selection
3. Any error messages from the Network tab in DevTools
