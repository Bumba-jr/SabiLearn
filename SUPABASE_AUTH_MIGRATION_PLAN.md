# Clerk to Supabase Auth Migration Plan

## Overview
Migrating from Clerk to Supabase Auth for authentication and user management.

## Benefits of Supabase Auth
- ✅ Integrated with existing Supabase database
- ✅ No third-party dependency issues
- ✅ Built-in email/password, OAuth, magic links
- ✅ Row Level Security (RLS) support
- ✅ Lower cost (included with Supabase)
- ✅ Better file upload integration

## Migration Steps

### 1. Database Schema Updates
- Update `profiles` table to use Supabase Auth `user_id` (UUID)
- Remove `clerk_user_id` column
- Add auth triggers for automatic profile creation
- Update foreign keys in related tables

### 2. Authentication Components
- Replace Clerk components with Supabase Auth
- Create custom sign-in/sign-up pages
- Implement session management
- Add password reset flow

### 3. Middleware Updates
- Replace Clerk middleware with Supabase session checking
- Maintain same routing logic (public/protected routes)
- Keep role-based redirects

### 4. API Route Updates
- Replace `auth()` from Clerk with Supabase session
- Update all API routes to use Supabase user ID
- Maintain same authorization logic

### 5. Client Component Updates
- Replace `useUser()` from Clerk with Supabase hook
- Update all components using Clerk hooks
- Create custom user context provider

### 6. File Upload Updates
- Update draft storage to use Supabase user ID
- Fix file upload issues (no more Clerk connection problems)

### 7. Admin Panel Updates
- Use Supabase user ID for admin identification
- Update admin authorization logic

## Files to Update

### Core Auth Files
- `app/layout.tsx` - Remove ClerkProvider, add Supabase provider
- `middleware.ts` - Replace Clerk middleware
- `app/sign-in/[[...sign-in]]/page.tsx` - Custom sign-in
- `app/sign-up/[[...sign-up]]/page.tsx` - Custom sign-up

### API Routes (20+ files)
- All files using `auth()` from Clerk
- Draft upload/download routes
- Admin routes
- Onboarding routes
- Profile routes

### Client Components (10+ files)
- All files using `useUser()` from Clerk
- Header component
- Hero section
- Dashboard pages
- Onboarding pages
- Admin panel

### Database
- Migration to update schema
- Auth triggers
- RLS policies

## Implementation Order

1. ✅ Create database migration
2. ✅ Create Supabase auth utilities
3. ✅ Create custom auth components
4. ✅ Update middleware
5. ✅ Update API routes
6. ✅ Update client components
7. ✅ Update layout and providers
8. ✅ Test authentication flow
9. ✅ Remove Clerk dependencies

## Testing Checklist

- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Password reset
- [ ] Role selection
- [ ] Tutor onboarding
- [ ] Student onboarding
- [ ] File uploads
- [ ] Dashboard access
- [ ] Admin panel access
- [ ] Protected routes
- [ ] Public routes

## Rollback Plan

If issues occur:
1. Keep Clerk env variables
2. Revert middleware changes
3. Revert API route changes
4. Database schema supports both (temporarily)

## Estimated Time
- Database setup: 30 minutes
- Auth components: 1 hour
- API updates: 1-2 hours
- Client updates: 1-2 hours
- Testing: 1 hour
- **Total: 4-6 hours**

## Notes

- Existing users will need to re-register (or we can migrate data)
- Session management is different (cookies vs JWT)
- OAuth providers need to be configured in Supabase
- Email templates can be customized in Supabase
