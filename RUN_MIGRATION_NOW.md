# Run Database Migration - Step by Step

## ⚠️ IMPORTANT: Read Before Running

This migration will:
- Add `auth_user_id` columns to your tables
- Create triggers for automatic profile creation
- Set up Row Level Security (RLS) policies
- Keep existing `clerk_user_id` columns intact (safe rollback)

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on your project
3. In the left sidebar, click **SQL Editor**
4. Click **New Query**

## Step 2: Copy the Migration SQL

1. Open the file `RUN_AUTH_MIGRATION.sql` in your editor
2. Copy the ENTIRE contents (Cmd+A, Cmd+C on Mac)

## Step 3: Run the Migration

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Cmd+Enter)
3. Wait for it to complete (should take 2-5 seconds)

## Step 4: Verify Success

You should see a success message:
```
status: "Migration completed successfully! You can now use Supabase Auth."
```

If you see any errors, **STOP** and share the error message.

## Step 5: Test Authentication

After the migration completes:

1. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   pnpm dev
   ```

2. **Test sign up:**
   - Go to http://localhost:3000/sign-up
   - Create a new account
   - Check if you're redirected to role selection

3. **Check the database:**
   - Go to Supabase Dashboard → Authentication → Users
   - You should see your new user
   - Go to Table Editor → profiles
   - You should see a profile with `auth_user_id` matching your user ID

## Step 6: Get Your Admin User ID

1. After signing up, go to: http://localhost:3000/get-admin-id
2. Copy your Supabase User ID
3. Open `.env.local`
4. Update or add:
   ```
   ADMIN_USER_ID=your-supabase-user-id-here
   ```
5. Restart your dev server

## Step 7: Remove Clerk (Optional - After Testing)

Once everything works:

```bash
pnpm remove @clerk/nextjs @clerk/clerk-react
```

Remove from `.env.local`:
```
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...
```

## Troubleshooting

### Error: "relation already exists"
This is safe - it means the column/index already exists. The migration will skip it.

### Error: "permission denied"
Make sure you're using the Supabase SQL Editor, not a direct database connection.

### Error: "syntax error"
Make sure you copied the ENTIRE file, including the first and last lines.

### Users can't sign up
1. Check Supabase Dashboard → Authentication → Providers
2. Make sure Email provider is enabled
3. Check your browser console for errors

### Profiles not created automatically
1. Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If missing, re-run the migration

## What This Migration Does

### Tables Modified:
- ✅ `profiles` - Added `auth_user_id` column
- ✅ `tutors` - Added `auth_user_id` column  
- ✅ `tutor_onboarding_drafts` - Added `auth_user_id` column

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Policies created for user data access
- ✅ Service role access maintained

### Automation:
- ✅ Trigger to auto-create profiles on signup
- ✅ Helper function for getting current user profile

### Safety:
- ✅ Old `clerk_user_id` columns kept intact
- ✅ Can rollback if needed
- ✅ No data loss

## Next Steps After Migration

1. ✅ Test sign up flow
2. ✅ Test sign in flow
3. ✅ Test role selection
4. ✅ Test onboarding (tutor and student)
5. ✅ Test file uploads
6. ✅ Test admin panel
7. ✅ Remove Clerk dependencies

## Need Help?

If you encounter any issues:
1. Check the error message in Supabase SQL Editor
2. Check browser console for client-side errors
3. Check server logs for API errors
4. Share the specific error message for help

---

**Ready to proceed?** Copy `RUN_AUTH_MIGRATION.sql` and paste it into Supabase SQL Editor!
