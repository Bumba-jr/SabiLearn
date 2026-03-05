# Expected Errors Before Migration

## ⚠️ These Errors Are Normal (Before Setup)

If you see these errors in the console **before** applying the database migration, they are **expected and harmless**:

```
Failed to fetch drafts from server
```

### Why This Happens

The tutor onboarding page tries to load draft files when it mounts. Since you haven't applied the database migration yet, the `tutor_onboarding_drafts` table doesn't exist, so the API returns an error.

### What Happens

1. Page loads normally ✅
2. Tries to fetch drafts from server
3. Gets error (table doesn't exist)
4. Logs warning to console
5. Continues without drafts ✅
6. File upload inputs work normally ✅

**The page still works perfectly!** You just won't have draft restoration until you apply the migration.

### How to Fix

Apply the database migration:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`
3. Refresh the page
4. Errors will disappear ✅

### After Migration

Once you apply the migration:
- ✅ No more console errors
- ✅ Draft restoration works
- ✅ Files persist across page refreshes
- ✅ Full draft storage functionality

## Current Status

**Before Migration:**
- ⚠️ Console warnings (harmless)
- ✅ Page loads and works
- ✅ File uploads work
- ❌ Draft restoration doesn't work yet

**After Migration:**
- ✅ No console warnings
- ✅ Page loads and works
- ✅ File uploads work
- ✅ Draft restoration works

---

**TL;DR:** The errors are expected before setup. The page still works fine. Apply the migration to enable draft restoration and remove the errors.
