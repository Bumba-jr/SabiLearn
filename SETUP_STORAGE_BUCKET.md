# Setup Supabase Storage Bucket

## Steps to Create the Drafts Bucket

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Name: `drafts`
   - Public: **OFF** (keep it private)
   - Click "Create bucket"

3. **Set Up Storage Policies**
   
   Go to Storage → Policies and add these policies for the `drafts` bucket:

   ### Policy 1: Allow authenticated users to upload
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'drafts');
   ```

   ### Policy 2: Allow users to read their own files
   ```sql
   CREATE POLICY "Allow users to read own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'drafts' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

   ### Policy 3: Allow users to delete their own files
   ```sql
   CREATE POLICY "Allow users to delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'drafts' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

   ### Policy 4: Allow service role full access
   ```sql
   CREATE POLICY "Service role full access"
   ON storage.objects FOR ALL
   TO service_role
   USING (bucket_id = 'drafts');
   ```

4. **Verify Setup**
   - The bucket should appear in your Storage dashboard
   - Try uploading a file from your app
   - Check the Storage dashboard to see if the file appears

## Troubleshooting

If uploads still fail:
- Check that the bucket name is exactly `drafts` (lowercase)
- Verify the bucket is created and not deleted
- Check the browser console for specific error messages
- Look at the Network tab to see the actual API response
