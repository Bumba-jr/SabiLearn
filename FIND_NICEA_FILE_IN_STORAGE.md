# Finding Nicea's Profile Photo in Storage

Since there's no record in the `tutor_onboarding_drafts` table, we need to check the Storage directly.

## Option 1: Check Storage via Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Click on the **drafts** bucket
4. Look for a folder named: `176e7443-2bb1-437d-acf8-06f47f4f06c0`
5. Inside that folder, look for a `profile_photo` subfolder
6. If you find an image file there:
   - Click on it
   - Click "Get URL" or "Copy URL"
   - Copy the public URL
7. Then run this SQL:
   ```sql
   UPDATE tutors
   SET avatar_url = 'PASTE_THE_URL_HERE'
   WHERE id = '176e7443-2bb1-437d-acf8-06f47f4f06c0';
   ```

## Option 2: The Photo Might Not Exist

If you don't find any file in Storage, it means:
- The upload failed silently during onboarding
- The file was never actually uploaded
- Nicea needs to go through onboarding again

## Option 3: Use the Fallback Avatar (Recommended for Now)

Since we already fixed the fallback avatar rendering in the code, the find-tutors page should now show a nice circular badge with "N" for Nicea.

Just refresh the page at `http://localhost:3000/find-tutors` and you should see:
- Faith Tuesday: Real photo ✅
- Nicea nia: Fallback avatar with "N" ✅

## Next Steps

1. Check if the fallback avatar is now showing correctly
2. If you want Nicea to have a real photo, ask them to:
   - Log in
   - Go through the tutor onboarding again
   - Upload a new profile photo
   - With our fixes in place, it will save correctly this time

## Why This Happened

The draft metadata wasn't saved because:
1. The upload might have failed during Nicea's onboarding
2. OR the draft cleanup ran and removed the metadata
3. OR there was an error during the upload that wasn't caught

With the fixes we just made, this won't happen to new tutors going forward.
