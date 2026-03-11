# Find Tutors Page - Image Fix Summary

## Issues Fixed

### 1. ✅ Latest Experience Display
Changed from showing first experience to showing the most recent (last) experience.

**Change:** `tutor.experiences[0]` → `tutor.experiences[tutor.experiences.length - 1]`

### 2. ✅ Drafts Bucket Made Public
Ran SQL to make the drafts bucket public so images can be accessed.

```sql
UPDATE storage.buckets SET public = true WHERE name = 'drafts';
```

### 3. ✅ Next.js Image Configuration
Updated `next.config.ts` to allow images from both avatars and drafts buckets.

### 4. ✅ Enhanced Logging
Added detailed logging in the API to track image URL generation.

## Current Status

### Working
- **Faith Tuesday**: Has image URL in drafts bucket → Image displays correctly ✅
- **Experience display**: Shows most recent experience ✅

### Issue
- **Nicea nia**: Has NULL avatar_url → Should show fallback avatar with "N" initial

## Fallback Avatar Logic

The code should show a fallback avatar when `tutor.image` is `null`:

```tsx
{/* Fallback Avatar */}
<div
    className="absolute inset-0 w-full h-full flex items-center justify-center"
    style={{ display: tutor.image ? 'none' : 'flex' }}
>
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
        {tutor.name.charAt(0).toUpperCase()}
    </div>
</div>
```

## Next Steps

If Nicea nia's fallback avatar isn't showing:

1. **Check the server terminal** for API logs showing:
   - `❌ No avatar_url for tutor: Nicea nia`

2. **Inspect the HTML** on the card:
   - Right-click the empty card
   - Select "Inspect Element"
   - Check if the fallback div exists and what its display style is

3. **Verify the data** by visiting:
   - `http://localhost:3000/api/tutors` - Check the JSON response

## Files Modified

1. `app/api/tutors/route.ts` - Fixed experience selection and added logging
2. `next.config.ts` - Added image domain configuration
3. `app/find-tutors/page.tsx` - Improved fallback avatar display
4. `lib/supabase-server.ts` - Removed problematic fetch wrapper

## Database Status

```
Nicea nia: avatar_url = NULL ❌
Faith Tuesday: avatar_url = https://...drafts/.../profile_photo/...jpg ✅
```

Both tutors should display correctly - one with image, one with fallback.
