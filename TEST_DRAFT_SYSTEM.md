# Test Draft Storage System

## ✅ Setup Complete

Both database migrations have been successfully applied:
- ✅ `tutor_onboarding_drafts` table created
- ✅ Storage policies applied to `drafts` bucket

## Test the Draft System

### 1. Navigate to Tutor Onboarding
Open your browser and go to:
```
http://localhost:3000/onboarding/tutor
```

### 2. Test File Upload
1. Sign in with your Clerk account
2. Upload a file to any of these fields:
   - Degree Certificate
   - Government ID
   - NYSC Certificate
   - Profile Photo

### 3. Test Draft Restoration
1. After uploading a file, **refresh the page** (F5 or Cmd+R)
2. The uploaded file should be restored automatically
3. You should see the file name displayed below the input

### 4. Test Draft Persistence
1. Upload files to multiple fields
2. Close the browser tab
3. Open the page again
4. All uploaded files should be restored

## Expected Behavior

### On Upload:
- File is validated (size, type)
- File is uploaded to Supabase Storage (`drafts` bucket)
- Metadata is saved to `tutor_onboarding_drafts` table
- File name appears below the input

### On Page Load:
- System fetches all drafts for the current user
- Files are restored to their respective inputs
- File names are displayed

### On Form Submit:
- All draft references are cleared from localStorage
- Files remain in storage for final processing

## Troubleshooting

### If files don't restore after refresh:

1. **Check Browser Console** (F12 → Console tab)
   - Look for any error messages
   - Common issues: authentication, network errors

2. **Check Network Tab** (F12 → Network tab)
   - Look for failed API calls to `/api/drafts/`
   - Check response status codes

3. **Verify Supabase Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Check if `drafts` bucket exists
   - Verify files are being uploaded

4. **Check Database**
   - Go to Supabase Dashboard → Table Editor
   - Open `tutor_onboarding_drafts` table
   - Verify records are being created

### Common Issues:

**"Failed to fetch drafts from server"**
- Check if you're signed in with Clerk
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check if the `tutor_onboarding_drafts` table exists

**Files upload but don't restore**
- Check browser localStorage (F12 → Application → Local Storage)
- Look for keys like `draft_degree_certificate`
- Verify the draft IDs match records in the database

**Upload fails**
- Check file size (max 5MB for documents, 100MB for videos)
- Verify file type is allowed
- Check Supabase Storage bucket permissions

## Next Steps

Once you've verified the draft system works:

1. Test the complete onboarding flow
2. Submit the form and verify drafts are cleared
3. Test the cleanup cron job (optional)
4. Deploy to production

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the terminal for server-side errors
3. Verify all environment variables are set
4. Ensure the Supabase migrations were applied successfully
