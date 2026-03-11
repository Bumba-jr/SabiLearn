# Storage Upload Fix

## Problem
File uploads to Supabase Storage were failing with "fetch failed" error.

## Root Cause
The custom `fetchWithTimeout` wrapper in `lib/supabase-server.ts` was interfering with Supabase's internal fetch calls.

## Changes Made

### 1. Simplified Supabase Admin Client
Removed the custom fetch wrapper and simplified the client configuration in `lib/supabase-server.ts`.

### 2. Enhanced Error Logging
Added detailed logging in `lib/storage/draft-storage.ts` to help diagnose connection issues.

### 3. Created Test Endpoint
Created `/api/test-supabase-connection` to verify:
- Supabase URL and service key configuration
- Storage bucket access
- Database connectivity

## Next Steps

1. **Test the connection:**
   ```bash
   curl http://localhost:3000/api/test-supabase-connection
   ```

2. **Check the dev server logs** when uploading files to see detailed error information

3. **Verify storage bucket exists** in Supabase dashboard:
   - Go to Storage section
   - Ensure "drafts" bucket exists
   - Check bucket is configured correctly

4. **If bucket doesn't exist**, run the migration:
   ```sql
   -- In Supabase SQL Editor
   -- Create drafts bucket
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('drafts', 'drafts', false)
   ON CONFLICT (id) DO NOTHING;
   ```

## Testing
Try uploading a file in the onboarding form and check:
- Browser console for client-side errors
- Terminal/dev server logs for server-side errors
- The test endpoint response for connection status
