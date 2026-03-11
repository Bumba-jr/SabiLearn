# Set Up Google Sign-In (5 Minutes)

## Your Callback URL (Copy This!)
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

---

## Step 1: Go to Google Cloud Console (1 minute)

1. Open: https://console.cloud.google.com
2. Sign in with your Google account
3. Click **Select a project** at the top
4. Click **NEW PROJECT**
5. Name: **SabiLearn**
6. Click **CREATE**
7. Wait 10 seconds, then select the project

---

## Step 2: Set Up OAuth Consent (2 minutes)

1. In the left menu, click: **APIs & Services** → **OAuth consent screen**
2. Choose: **External**
3. Click: **CREATE**

Fill in only these fields:
- **App name:** SabiLearn
- **User support email:** (your email)
- **Developer contact information:** (your email)

4. Click **SAVE AND CONTINUE**
5. Click **SAVE AND CONTINUE** again (skip scopes)
6. Click **SAVE AND CONTINUE** again (skip test users)
7. Click **BACK TO DASHBOARD**

---

## Step 3: Create OAuth Credentials (2 minutes)

1. In the left menu, click: **APIs & Services** → **Credentials**
2. Click: **+ CREATE CREDENTIALS** (at the top)
3. Choose: **OAuth client ID**
4. Application type: **Web application**
5. Name: **SabiLearn Web**

### Add These URLs:

**Authorized JavaScript origins** (click + ADD URI):
```
http://localhost:3000
```

**Authorized redirect URIs** (click + ADD URI):
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

6. Click **CREATE**

### IMPORTANT: Copy These!
You'll see a popup with:
- **Client ID** (looks like: 123456789-abc.apps.googleusercontent.com)
- **Client Secret** (looks like: GOCSPX-abc123)

**Keep this popup open!**

---

## Step 4: Add to Supabase (1 minute)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **Authentication** → **Providers**
4. Find **Google** and toggle it **ON**
5. Paste your **Client ID**
6. Paste your **Client Secret**
7. Click **Save**

---

## Step 5: Test It! (1 minute)

```bash
# Restart your dev server
pnpm dev
```

1. Go to: http://localhost:3000/sign-up
2. You should see **"Continue with Google"** button
3. Click it
4. Choose your Google account
5. Grant permissions
6. Should redirect to role selection!

---

## ✅ Done!

Users can now sign up/sign in with Google! 🎉

---

## 🆘 Troubleshooting

### "redirect_uri_mismatch" error
**Fix:** Make sure you added this EXACT URL to Google Console:
```
https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback
```

### Google button doesn't show
**Fix:**
1. Make sure Google is enabled in Supabase (toggle ON)
2. Make sure you saved Client ID and Secret
3. Restart dev server: `pnpm dev`

### "Access blocked" error
**Fix:**
1. Make sure OAuth consent screen is configured
2. Try with the Google account you used to create the project

---

## 📋 Quick Checklist

- [ ] Create Google Cloud project
- [ ] Set up OAuth consent screen
- [ ] Create OAuth credentials
- [ ] Add callback URL: `https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Secret
- [ ] Enable Google in Supabase
- [ ] Paste credentials in Supabase
- [ ] Restart dev server
- [ ] Test sign up with Google

---

**Total time:** 5 minutes

**Your callback URL:** `https://vgmflkoykskpqxryrdsp.supabase.co/auth/v1/callback`

Let me know when you're done! 🚀
