# Supabase Auth Migration - Current Status

## ✅ COMPLETED (60% Done)

### Core Infrastructure
- ✅ `lib/auth/supabase-auth.ts` - Server auth utilities
- ✅ `lib/auth/AuthProvider.tsx` - Client auth context
- ✅ `app/layout.tsx` - Uses AuthProvider
- ✅ `middleware.ts` - Uses Supabase sessions
- ✅ `RUN_AUTH_MIGRATION.sql` - Database migration ready

### Auth Pages
- ✅ `app/sign-in/[[...sign-in]]/page.tsx`
- ✅ `app/sign-up/[[...sign-up]]/page.tsx`
- ✅ `app/forgot-password/page.tsx`

### API Routes (Partial)
- ✅ `app/api/onboarding/tutor/route.ts`
- ✅ `app/api/profile/route.ts`
- ✅ `app/api/admin/stats/route.ts`
- ✅ `app/api/admin/users/route.ts`
- ✅ `app/api/admin/verify/route.ts`
- ⚠️  `app/api/drafts/upload/route.ts` (partially updated)

## ⏳ REMAINING (40% To Do)

### API Routes Need Update
```
app/api/drafts/[clerkUserId]/route.ts
app/api/drafts/[clerkUserId]/[fileType]/route.ts
app/api/drafts/download/[draftId]/route.ts
app/api/drafts/me/route.ts
app/api/drafts/cleanup/route.ts
```

### Client Components Need Update
```
components/header.tsx
components/hero-section.tsx
app/role-selection/page.tsx
app/onboarding/tutor/page.tsx
app/onboarding/student/page.tsx
app/dashboard/tutor/page.tsx
app/admin/page.tsx
app/get-admin-id/page.tsx
app/onboarding/tutor/TutorOnboardingWithDrafts.tsx
```

### Library Files Need Update
```
lib/db/draft-operations.ts (partially updated)
```

## 🔧 Quick Fix Guide

### For API Routes
Replace:
```typescript
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
```

With:
```typescript
import { getServerUser } from '@/lib/auth/supabase-auth';
const user = await getServerUser();
const userId = user?.id;
```

### For Client Components
Replace:
```typescript
import { useUser } from '@clerk/nextjs';
const { user } = useUser();
```

With:
```typescript
import { useAuth } from '@/lib/auth/AuthProvider';
const { user } = useAuth();
```

### For Database Operations
Replace `clerk_user_id` with `auth_user_id` in:
- Database queries
- Function parameters
- Type definitions

## 🚀 Next Steps

1. **Complete lib/db/draft-operations.ts**
   - Update all functions to use `auth_user_id`
   - Update function parameters from `clerkUserId` to `userId`

2. **Update Remaining API Routes**
   - Draft routes (5 files)
   - Use pattern from completed routes

3. **Update Client Components**
   - Header and hero (2 files)
   - Pages (7 files)
   - Use pattern from auth pages

4. **Test Everything**
   - Sign up/in/out
   - Role selection
   - Onboarding flows
   - File uploads
   - Admin panel

5. **Clean Up**
   - Remove Clerk from package.json
   - Remove Clerk env variables
   - Update documentation

## 📝 Testing Checklist

After completing updates:

- [ ] Sign up new user
- [ ] Confirm email (if enabled)
- [ ] Sign in
- [ ] Select role
- [ ] Complete tutor onboarding
- [ ] Upload files
- [ ] Access dashboard
- [ ] Sign out
- [ ] Password reset
- [ ] Admin panel access
- [ ] Find tutors page

## 🎯 Estimated Time Remaining

- Complete draft operations: 10 min
- Update API routes: 15 min
- Update components: 20 min
- Testing: 15 min
- **Total: ~60 minutes**

## 💡 Tips

1. Use search/replace in your editor for bulk updates
2. Test after each major section
3. Keep Clerk dependencies until everything works
4. Database supports both column names during transition

## 🔗 Related Files

- `MIGRATION_PROGRESS.md` - Detailed progress
- `SUPABASE_AUTH_MIGRATION_GUIDE.md` - Complete guide
- `RUN_AUTH_MIGRATION.sql` - Database migration
- `scripts/complete-auth-migration.sh` - Helper script
