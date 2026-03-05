# 🚀 Quick Start - Draft Storage

## ✅ What's Done

All code is integrated! The draft storage system is ready to use.

## ⚠️ Expected Console Warnings

Before you apply the migration, you'll see these console warnings:
```
Failed to fetch drafts from server
```

**This is normal!** The page still works fine. See `EXPECTED_ERRORS_BEFORE_MIGRATION.md` for details.

## 📋 Your To-Do List (15 minutes)

### 1. Database Migration (5 min)

Open Supabase Dashboard and run this SQL:

```sql
-- Copy from: supabase/migrations/003_tutor_onboarding_drafts_storage.sql
-- Paste in: Supabase Dashboard → SQL Editor → New Query
```

### 2. Storage Bucket (5 min)

In Supabase Dashboard → Storage:
- Create bucket: `drafts` (private, 100MB limit)
- Apply 3 RLS policies from `supabase/DRAFT_STORAGE_SETUP.md`

### 3. Test It (5 min)

```bash
pnpm dev
```

Then:
1. Go to http://localhost:3000/onboarding/tutor
2. Upload files in Step 4 and Step 5
3. Refresh the page
4. Verify files are restored ✨

## 🎯 That's It!

Once you complete these 3 steps, the draft storage system will be fully functional.

## 📚 Need More Info?

- **Setup Details:** `INTEGRATION_COMPLETE.md`
- **API Docs:** `docs/api/draft-storage.md`
- **Developer Guide:** `docs/draft-storage-guide.md`

---

**Admin API Key (already set):**
```
zXN4tqeZMyh7qqYr7RznT2qStxH9EyVL5GNrNzOT2Ds=
```

Add this to Vercel when deploying!
