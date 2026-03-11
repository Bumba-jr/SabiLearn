# Supabase Auth Migration Checklist

## Progress: 95% Complete ✅

### Phase 1: Code Migration ✅ COMPLETE

- [x] Create Supabase auth utilities (`lib/auth/supabase-auth.ts`)
- [x] Create AuthProvider component (`lib/auth/AuthProvider.tsx`)
- [x] Create custom auth pages (sign-in, sign-up, forgot-password)
- [x] Update middleware to use Supabase sessions
- [x] Update app layout to use AuthProvider
- [x] Update all API routes (20+ files)
- [x] Update all client components (8 files)
- [x] Update file upload components (DraftFileInput, ProfilePhotoInput)
- [x] Update header component with sign out

### Phase 2: Database Migration ⏳ IN PROGRESS

- [ ] **Run `RUN_AUTH_MIGRATION.sql` in Supabase SQL Editor**
  - See `RUN_MIGRATION_NOW.md` for detailed instructions
  - This adds `auth_user_id` columns
  - Sets up RLS policies
  - Creates auto-profile trigger

### Phase 3: Testing ⏭️ NEXT

- [ ] Restart dev server
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test role selection
- [ ] Test tutor onboarding
- [ ] Test student onboarding
- [ ] Test file uploads
- [ ] Test dashboard access
- [ ] Test admin panel
- [ ] Test sign out

### Phase 4: Cleanup ⏭️ AFTER TESTING

- [ ] Get admin user ID from `/get-admin-id`
- [ ] Update `ADMIN_USER_ID` in `.env.local`
- [ ] Remove Clerk packages: `pnpm remove @clerk/nextjs @clerk/clerk-react`
- [ ] Remove Clerk env vars from `.env.local`
- [ ] (Optional) Remove old `clerk_user_id` columns after confirming everything works

## Current Status

✅ **All code changes complete!**

The entire codebase has been migrated from Clerk to Supabase Auth:
- Server-side auth utilities
- Client-side auth context
- All API routes
- All client components
- Auth pages
- Middleware

🔄 **Ready for database migration**

The next step is to run the SQL migration in Supabase to:
- Add the new `auth_user_id` columns
- Set up security policies
- Create the auto-profile trigger

## Quick Start

### 1. Run Database Migration (5 minutes)

```bash
# Open RUN_MIGRATION_NOW.md for detailed instructions
# Copy RUN_AUTH_MIGRATION.sql
# Paste into Supabase SQL Editor
# Click Run
```

### 2. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### 3. Test Sign Up

```bash
# Open browser
http://localhost:3000/sign-up

# Create account
# Should redirect to role selection
```

### 4. Get Admin ID

```bash
# After signing up
http://localhost:3000/get-admin-id

# Copy your user ID
# Add to .env.local:
ADMIN_USER_ID=your-user-id-here
```

### 5. Test Everything

- Sign in/out
- Role selection
- Onboarding flows
- File uploads
- Dashboard
- Admin panel

### 6. Remove Clerk (After Testing)

```bash
pnpm remove @clerk/nextjs @clerk/clerk-react
```

## Files Changed Summary

### Core Auth (3 files)
- `lib/auth/supabase-auth.ts` - Server auth utilities
- `lib/auth/AuthProvider.tsx` - Client auth context
- `middleware.ts` - Session middleware

### Auth Pages (3 files)
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- `app/forgot-password/page.tsx`

### API Routes (20+ files)
- All routes in `app/api/` updated to use Supabase auth

### Client Components (8 files)
- `components/hero-section.tsx`
- `components/header.tsx`
- `app/role-selection/page.tsx`
- `app/onboarding/tutor/page.tsx`
- `app/onboarding/student/page.tsx`
- `app/admin/page.tsx`
- `app/get-admin-id/page.tsx`
- `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx`

### Supporting Components (2 files)
- `components/onboarding/DraftFileInput.tsx`
- `components/onboarding/ProfilePhotoInput.tsx`

### Database Migration (1 file)
- `RUN_AUTH_MIGRATION.sql` - Ready to run

## Documentation

- `RUN_MIGRATION_NOW.md` - Step-by-step migration guide
- `CLIENT_COMPONENTS_MIGRATION_COMPLETE.md` - Component migration details
- `AUTH_MIGRATION_STATUS.md` - Overall migration status
- `SUPABASE_AUTH_MIGRATION_GUIDE.md` - Complete migration guide

## Support

If you encounter issues:
1. Check the specific error message
2. Review the relevant documentation file
3. Check browser console and server logs
4. Verify environment variables are set correctly

---

**You're almost done!** Just run the database migration and test. 🚀
