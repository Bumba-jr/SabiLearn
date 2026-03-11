# Google OAuth Setup Guide

## Step 1: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Sign in with Google** to ON
6. You'll need to set up Google Cloud Console credentials

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: SabiLearn
   - User support email: your email
   - Developer contact: your email
   - Save and continue through the scopes (no changes needed)
   - Add test users if needed
   - Save and continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: SabiLearn
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (when deployed)
   - Authorized redirect URIs:
     - `https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback`
   - Click **Create**

7. Copy the **Client ID** and **Client Secret**

## Step 3: Add Credentials to Supabase

1. Go back to Supabase Dashboard → Authentication → Providers → Google
2. Paste your **Client ID** (from Google Cloud Console)
3. Paste your **Client Secret** (from Google Cloud Console)
4. Click **Save**

## Step 4: Test Google OAuth

1. Clear your browser cache or use incognito mode
2. Go to `http://localhost:3000/sign-up`
3. Click **Continue with Google**
4. You should be redirected to Google sign-in
5. After signing in with Google, you'll be redirected back to your app
6. You should land on `/role-selection`

## Expected Flow

```
Click "Continue with Google"
    ↓
Redirect to Google sign-in
    ↓
Sign in with Google account
    ↓
Google redirects to Supabase callback URL
    ↓
Supabase processes authentication
    ↓
Redirect to /auth/callback
    ↓
Redirect to /role-selection
    ↓
Select role and continue
```

## Troubleshooting

### Issue: "redirect_uri_mismatch" error

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

### Issue: Stuck on callback page

**Solution**: 
1. Check browser console for errors
2. Make sure email confirmation is disabled in Supabase (Authentication → Settings → Email Auth)
3. Clear browser cache and try again

### Issue: "Access blocked: This app's request is invalid"

**Solution**: 
1. Make sure OAuth consent screen is configured
2. Add your email as a test user in Google Cloud Console
3. Verify the app is in "Testing" mode (not "Production")

## Production Deployment

When deploying to production:

1. Update Google Cloud Console:
   - Add your production domain to Authorized JavaScript origins
   - Keep the same Supabase callback URL

2. Update Supabase:
   - Add your production URL to Site URL (Authentication → URL Configuration)

3. Google OAuth Consent Screen:
   - Submit for verification if you want to remove the "unverified app" warning
   - Or keep it in testing mode (limited to 100 users)

## Security Notes

- Never commit your Google Client Secret to version control
- The Client Secret is only stored in Supabase, not in your code
- Supabase handles all OAuth token exchange securely
- Users' Google credentials are never exposed to your application

## What's Included

✅ Google sign-in button on sign-in page
✅ Google sign-up button on sign-up page
✅ Proper OAuth callback handling
✅ Automatic redirect to role selection
✅ Loading states and error handling
✅ Clean UI with Google branding colors
