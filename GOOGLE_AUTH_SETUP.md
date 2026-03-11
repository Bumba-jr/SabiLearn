# Google OAuth Setup Guide

## Step 1: Enable Google Provider in Supabase (5 minutes)

### 1.1 Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab

### 1.2 Enable Google Provider
1. Find **Google** in the list
2. Toggle it **ON** (enabled)
3. You'll see two fields:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)

Keep this page open - we'll come back to fill these in.

---

## Step 2: Create Google OAuth Credentials (10 minutes)

### 2.1 Go to Google Cloud Console
1. Open https://console.cloud.google.com
2. Sign in with your Google account

### 2.2 Create a New Project (or use existing)
1. Click the project dropdown at the top
2. Click **New Project**
3. Name it: "SabiLearn" (or your app name)
4. Click **Create**
5. Wait for it to be created, then select it

### 2.3 Enable Google+ API
1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it
4. Click **Enable**

### 2.4 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public apps)
3. Click **Create**

4. Fill in the form:
   - **App name:** SabiLearn
   - **User support email:** your-email@gmail.com
   - **App logo:** (optional)
   - **Application home page:** http://localhost:3000 (for now)
   - **Authorized domains:** (leave empty for localhost testing)
   - **Developer contact:** your-email@gmail.com

5. Click **Save and Continue**
6. Skip **Scopes** (click Save and Continue)
7. Skip **Test users** (click Save and Continue)
8. Click **Back to Dashboard**

### 2.5 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it: "SabiLearn Web"

5. Add **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://vgmflkoykskpqxryrdsp.supabase.co
   ```

6. Add **Authorized redirect URIs:**
   ```
   https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
   ```

7. Click **Create**

8. **IMPORTANT:** Copy these values:
   - **Client ID** (looks like: 123456789-abc123.apps.googleusercontent.com)
   - **Client Secret** (looks like: GOCSPX-abc123xyz)

---

## Step 3: Configure Supabase with Google Credentials

### 3.1 Go Back to Supabase
1. Open Supabase Dashboard → Authentication → Providers
2. Find **Google** provider
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **Save**

---

## Step 4: Update Your Code (Already Done!)

The code is already set up to support Google OAuth. No changes needed!

---

## Step 5: Test Google Sign In

### 5.1 Restart Dev Server
```bash
pnpm dev
```

### 5.2 Test Sign Up with Google
1. Go to http://localhost:3000/sign-up
2. Click **Continue with Google** button
3. Choose your Google account
4. Grant permissions
5. You should be redirected to role selection

### 5.3 Test Sign In with Google
1. Go to http://localhost:3000/sign-in
2. Click **Continue with Google** button
3. Should sign you in automatically

---

## Step 6: Production Setup (When Deploying)

When you deploy to production (e.g., Vercel):

### 6.1 Update Google OAuth Credentials
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add production URLs:

**Authorized JavaScript origins:**
```
https://your-domain.com
https://vgmflkoykskpqxryrdsp.supabase.co
```

**Authorized redirect URIs:**
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

### 6.2 Update OAuth Consent Screen
1. Change from **Testing** to **Production**
2. Submit for verification (if needed)

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** Make sure the redirect URI in Google Console exactly matches:
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"
**Solution:** 
1. Check OAuth consent screen is configured
2. Make sure Google+ API is enabled
3. Verify authorized domains are correct

### Google button doesn't appear
**Solution:**
1. Check Supabase Dashboard → Authentication → Providers
2. Make sure Google is enabled
3. Verify Client ID and Secret are saved
4. Restart dev server

### Users can sign in but profile not created
**Solution:**
1. Make sure database migration was run
2. Check if trigger exists: `on_auth_user_created`
3. Check Supabase logs for errors

---

## Quick Reference

### Your Supabase Project URL
```
https://vgmflkoykskpqxryrdsp.supabase.co
```

### Redirect URI for Google Console
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

### Where to Get Credentials
- **Google Console:** https://console.cloud.google.com/apis/credentials
- **Supabase Dashboard:** https://supabase.com/dashboard → Authentication → Providers

---

## Summary

1. ✅ Enable Google provider in Supabase
2. ✅ Create Google OAuth credentials
3. ✅ Configure redirect URIs
4. ✅ Add credentials to Supabase
5. ✅ Test sign in/sign up
6. ✅ Works automatically with existing code!

**Total time:** ~15 minutes

**No code changes needed** - the sign-in/sign-up pages already support OAuth providers!
