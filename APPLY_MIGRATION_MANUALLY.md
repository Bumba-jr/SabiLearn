# Apply Database Migration Manually

Since Supabase CLI is not installed, follow these steps to apply the migration through the Supabase Dashboard:

## Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `vgmflkoykskpqxryrdsp`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`
   - Copy ALL the contents

4. **Paste and Execute**
   - Paste the SQL into the query editor
   - Click "Run" or press Cmd+Enter

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Run this verification query:
   ```sql
   SELECT * FROM tutor_onboarding_drafts LIMIT 1;
   ```
   - You should see the table structure (even if empty)

6. **Check RLS Policies**
   - Run this query to verify policies were created:
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename = 'tutor_onboarding_drafts';
   ```
   - You should see 4 policies: select, insert, update, delete

## Next: Storage Bucket Setup

After the migration is applied, proceed to create the storage bucket.
