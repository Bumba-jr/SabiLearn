# Supabase Setup for SabiLearn

## Getting Started

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: SabiLearn
   - Database Password: (choose a strong password)
   - Region: (choose closest to Nigeria, e.g., eu-west-1)
5. Click "Create new project"

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Update Environment Variables

Update your `.env.local` file with the values from step 2:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Database Migrations

#### Migration 001: Initial Schema (✓ Completed)
1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"

This creates the base tables:
- `tutors` - Tutor profiles and information
- `students` - Student profiles and information
- `sessions` - Booking sessions between tutors and students
- `reviews` - Reviews and ratings for tutors
- `messages` - In-app messaging between users

#### Migration 002: Authentication & Onboarding Schema
1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the contents of `supabase/migrations/002_auth_onboarding_schema.sql`
4. Paste and click "Run"

This adds authentication and onboarding tables:
- `profiles` - Central authentication table linking Clerk users to roles
- `parents` - Parent user profiles
- `onboarding_progress` - Saves partial onboarding data for resumption
- Extends `tutors` table with onboarding fields (experience_level, grade_levels, bank details, etc.)
- Extends `students` table with onboarding fields (subjects_needed, learning_goals, etc.)
- Adds database triggers for role locking and progress cleanup
- Updates RLS policies for all tables

#### Migration 003: Draft Storage Setup
1. Follow the detailed guide in `supabase/DRAFT_STORAGE_SETUP.md`
2. Create the 'drafts' storage bucket via Supabase Dashboard
3. Run the migration `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`

This sets up:
- Private 'drafts' bucket for temporary file uploads during onboarding
- RLS policies for user-scoped file access
- 100MB file size limit
- Automatic cleanup of expired drafts (30 days)

#### Storage Buckets Setup
After running migrations, create storage buckets:

1. Navigate to Storage in your Supabase dashboard
2. Click "New bucket"
3. Create four buckets:
   - **drafts** (private) - for temporary onboarding file uploads (see Migration 003)
   - **avatars** (public) - for profile photos
   - **videos** (public) - for tutor intro videos  
   - **credentials** (private) - for tutor credentials/certificates
4. For each bucket, go to Policies and apply the RLS policies from the migrations

### 5. Configure Authentication (Optional)

If you want to use Supabase Auth instead of Clerk:

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure any social providers you want (Google, etc.)
4. Update your code to use Supabase Auth instead of Clerk

### 6. Set Up Storage (Optional)

For profile pictures and file uploads:

1. Go to Storage
2. Create a new bucket called `avatars`
3. Set the bucket to public
4. Create policies for upload/download

## Database Schema

### Tutors Table
- Stores tutor profiles, subjects, rates, and verification status
- Linked to Clerk user ID

### Students Table
- Stores student profiles and parent information
- Linked to Clerk user ID

### Sessions Table
- Booking information between tutors and students
- Tracks payment status and session completion

### Reviews Table
- Student reviews and ratings for tutors
- Updates tutor's average rating

### Messages Table
- In-app messaging between tutors and students/parents
- Real-time updates via Supabase Realtime

## API Usage Examples

### Fetch All Tutors

```typescript
import { supabase } from '@/lib/supabase';

const { data: tutors, error } = await supabase
  .from('tutors')
  .select('*')
  .eq('is_verified', true)
  .order('rating', { ascending: false });
```

### Create a Session

```typescript
const { data, error } = await supabase
  .from('sessions')
  .insert({
    tutor_id: 'uuid',
    student_id: 'uuid',
    subject: 'Mathematics',
    scheduled_at: '2024-01-01T10:00:00Z',
    duration_minutes: 60,
    amount: 5000
  });
```

### Send a Message

```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    sender_id: 'clerk_user_id',
    receiver_id: 'clerk_user_id',
    content: 'Hello!'
  });
```

## Real-time Subscriptions

Subscribe to new messages:

```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

## Next Steps

1. Remove Convex dependencies: `pnpm remove convex`
2. Delete the `convex` folder
3. Update any components using Convex queries to use Supabase
4. Test the application with Supabase backend

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
