# Authentication and Onboarding Flow - Fixed

## Problem
Users were being forced through the entire onboarding flow (role selection → onboarding → dashboard) every time they signed in, even after completing onboarding.

## Root Cause
1. Role was being set in the `profiles` table immediately when user selected a role
2. Auth callback always redirected to `/role-selection` regardless of onboarding status
3. No check for completed onboarding on sign-in

## Solution Implemented

### 1. Updated Auth Callback (`app/auth/callback/page.tsx`)
Now checks user's profile status and redirects accordingly:
- If `onboarding_completed = true` AND `role` is set → Redirect to `/dashboard/{role}`
- If `role` is set BUT `onboarding_completed = false` → Redirect to `/onboarding/{role}`
- If no role → Redirect to `/role-selection`

### 2. Updated Profile API (`app/api/profile/route.ts`)
- **Changed behavior**: Role is NO LONGER set when user selects a role
- Profile is created with `role = null` and `onboarding_completed = false`
- Returns `selectedRole` in response for routing purposes only
- Role will only be set when onboarding form is submitted

### 3. Updated Tutor Onboarding API (`app/api/onboarding/tutor/route.ts`)
- Now sets `role = 'tutor'` in profiles table when form is submitted
- Also sets `onboarding_completed = true`
- This ensures role is only attached after successful form submission

### 4. Created Student Onboarding API (`app/api/onboarding/student/route.ts`)
- New endpoint specifically for student onboarding
- Sets `role = 'student'` in profiles table when form is submitted
- Also sets `onboarding_completed = true`
- Creates/updates record in `students` table

### 5. Updated Student Onboarding Page (`app/onboarding/student/page.tsx`)
- Changed API endpoint from `/api/onboarding/tutor` to `/api/onboarding/student`
- Now uses correct endpoint for student submissions

## New Flow

### First Time User (Sign Up)
1. User signs up → Auth callback
2. No profile exists → Redirect to `/role-selection`
3. User selects role (e.g., "tutor") → Profile created with `role = null`
4. Redirect to `/onboarding/tutor`
5. User fills form and submits → `role = 'tutor'` and `onboarding_completed = true` are set
6. Redirect to `/dashboard/tutor`

### Returning User (Sign In)
1. User signs in → Auth callback
2. Profile exists with `role = 'tutor'` and `onboarding_completed = true`
3. **Direct redirect to `/dashboard/tutor`** ✅
4. No need to go through role selection or onboarding again

### User Who Abandoned Onboarding
1. User signs in → Auth callback
2. Profile exists with `role = null` and `onboarding_completed = false`
3. Redirect to `/role-selection` to start over
4. User can select a different role if they want

### User Who Started But Didn't Complete Onboarding
1. User signs in → Auth callback
2. Profile exists with `role = null` (no role set yet) and `onboarding_completed = false`
3. Redirect to `/role-selection`
4. User selects role → Redirect to `/onboarding/{role}`
5. User can complete the form or abandon again

## Key Benefits

1. **Role is only set on successful form submission** - Users can change their mind during onboarding
2. **Returning users skip onboarding** - Direct to dashboard based on their role
3. **Proper separation of concerns** - Role selection doesn't commit the user to a role
4. **Separate endpoints for different roles** - Tutor and student onboarding are properly separated

## Database Schema

### profiles table
- `auth_user_id` (UUID) - Supabase Auth user ID
- `role` (TEXT) - 'tutor', 'student', or 'parent' (NULL until onboarding completed)
- `onboarding_completed` (BOOLEAN) - false until form submitted
- `created_at`, `updated_at` (TIMESTAMP)

### tutors table
- `auth_user_id` (UUID) - Links to profiles
- All tutor-specific fields
- Created/updated when tutor onboarding is submitted

### students table
- `auth_user_id` (UUID) - Links to profiles
- All student-specific fields
- Created/updated when student onboarding is submitted

## Testing Checklist

- [ ] New user signs up → Goes through role selection → Onboarding → Dashboard
- [ ] User completes onboarding → Signs out → Signs in → Goes directly to dashboard
- [ ] User selects role but doesn't complete onboarding → Signs out → Signs in → Goes to role selection
- [ ] User can change role selection if they haven't completed onboarding
- [ ] Tutor onboarding sets role to 'tutor' in profiles table
- [ ] Student onboarding sets role to 'student' in profiles table
- [ ] Dashboard redirects work correctly based on role
