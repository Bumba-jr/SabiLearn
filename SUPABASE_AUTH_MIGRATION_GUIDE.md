# Supabase Auth Migration - Complete Guide

## What Was Done

I've migrated your authentication system from Clerk to Supabase Auth. Here's everything that changed:

## ✅ Files Created

### Auth System
- `lib/auth/supabase-auth.ts` - Server-side auth utilities
- `lib/auth/AuthProvider.tsx` - Client-side auth context and hooks
- `supabase/migrations/005_migrate_to_supabase_auth.sql` - Database migration

### Auth Pages
- `app/sign-in/[[...sign-in]]/page.tsx` - Custom sign-in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Custom sign-up page
- `app/forgot-password/page.tsx` - Password reset page

### Documentation
- `SUPABASE_AUTH_MIGRATION_PLAN.md` - Migration plan
- `SUPABASE_AUTH_MIGRATION_GUIDE.md` - This file

## ✅ Files Updated

- `app/layout.tsx` - Replaced ClerkProvider with AuthProvider

## ⏳ Files That Need Updating

You'll need to update these files to complete the migration:

### 1. Middleware (`middleware.ts`)
Replace Clerk middleware with Supabase session checking

### 2. API Routes (20+ files)
Replace `auth()` from Clerk with Supabase auth:
- `app/api/onboarding/tutor/route.ts`
- `app/api/profile/route.ts`
- `app/api/admin/*.ts`
- `app/api/drafts/**/*.ts`
- And all other API routes using Clerk auth

### 3. Client Components (10+ files)
Replace `useUser()` from Clerk with `useAuth()`:
- `components/header.tsx`
- `components/hero-section.tsx`
- `app/onboarding/tutor/page.tsx`
- `app/onboarding/student/page.tsx`
- `app/role-selection/page.tsx`
- `app/admin/page.tsx`
- `app/dashboard/tutor/page.tsx`
- `app/get-admin-id/page.tsx`

## 🚀 Setup Steps

### Step 1: Apply Database Migration

Run this SQL in Supabase Dashboard → SQL Editor:

```bash
# Copy the migration file content
cat supabase/migrations/005_migrate_to_supabase_auth.sql
```

Or run it directly if you have Supabase CLI:

```bash
supabase db push
```

### Step 2: Update Environment Variables

Update `.env.local`:

```bash
# Remove Clerk variables (keep for now as backup)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...

# Supabase variables (already exist)
NEXT_PUBLIC_SUPABASE_URL=https://vgmflkoykskpqxryrdsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Update admin user ID to Supabase UUID (after first user signs up)
ADMIN_USER_ID=<supabase-user-uuid>
```

### Step 3: Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs: 
  - `http://localhost:3000/role-selection`
  - `http://localhost:3000/dashboard/*`

### Step 4: Enable Email Auth

In Supabase Dashboard → Authentication → Providers:

- ✅ Enable Email provider
- Configure email templates (optional)
- Set up SMTP (optional, uses Supabase's by default)

### Step 5: Remove Clerk Dependencies

After everything works:

```bash
pnpm remove @clerk/nextjs @clerk/clerk-react
```

## 📝 How to Use New Auth System

### Client-Side (Components)

```typescript
import { useAuth, useProfile } from '@/lib/auth/AuthProvider';

function MyComponent() {
    const { user, signOut } = useAuth();
    const { profile, loading } = useProfile();

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Not signed in</div>;

    return (
        <div>
            <p>Email: {user.email}</p>
            <p>Role: {profile?.role}</p>
            <button onClick={signOut}>Sign Out</button>
        </div>
    );
}
```

### Server-Side (API Routes)

```typescript
import { requireAuth, getUserProfile } from '@/lib/auth/supabase-auth';

export async function GET() {
    try {
        const user = await requireAuth(); // Throws if not authenticated
        const profile = await getUserProfile(user.id);

        return NextResponse.json({ user, profile });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
```

### Middleware

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session && !isPublicRoute(request)) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}
```

## 🔄 Migration Strategy

### Option 1: Fresh Start (Recommended)
- Apply migration
- Users re-register with new system
- Clean slate, no data migration needed

### Option 2: Data Migration
- Export user data from Clerk
- Create Supabase Auth users programmatically
- Map old Clerk IDs to new Supabase IDs
- Update all records

## ✨ New Features Available

### 1. Magic Links
```typescript
const { error } = await supabase.auth.signInWithOtp({
    email: 'user@example.com',
});
```

### 2. OAuth Providers
Configure in Supabase Dashboard:
- Google
- GitHub
- Facebook
- Twitter
- And more...

### 3. Phone Auth
```typescript
const { error } = await supabase.auth.signInWithOtp({
    phone: '+1234567890',
});
```

### 4. Row Level Security
Automatic data isolation per user:
```sql
CREATE POLICY "Users can only see their own data"
ON profiles FOR SELECT
USING (auth.uid() = auth_user_id);
```

## 🐛 Troubleshooting

### Issue: "User not found"
- Make sure migration is applied
- Check that trigger creates profile on signup

### Issue: "Session not found"
- Clear browser cookies
- Check Supabase URL and keys in .env.local

### Issue: "Redirect loop"
- Check middleware logic
- Verify public routes are configured

### Issue: "Email not confirmed"
- Disable email confirmation in Supabase Dashboard
- Or check spam folder for confirmation email

## 📊 Testing Checklist

- [ ] Sign up new user
- [ ] Receive confirmation email
- [ ] Sign in with email/password
- [ ] Profile created automatically
- [ ] Role selection works
- [ ] Onboarding flow works
- [ ] File uploads work
- [ ] Dashboard access works
- [ ] Sign out works
- [ ] Password reset works
- [ ] Protected routes redirect to sign-in
- [ ] Public routes accessible without auth

## 🎯 Next Steps

1. Apply database migration
2. Test sign-up/sign-in flow
3. Update remaining files (I can help with this)
4. Test all features
5. Remove Clerk dependencies
6. Deploy to production

## 💡 Benefits You'll See

- ✅ No more Clerk connection issues
- ✅ File uploads work reliably
- ✅ Integrated with your database
- ✅ Lower costs
- ✅ More control over auth flow
- ✅ Better performance
- ✅ Simpler codebase

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Check browser console for errors
3. Verify environment variables
4. Test API endpoints directly

Let me know if you want me to continue updating the remaining files!
