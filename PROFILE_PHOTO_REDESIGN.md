# Profile Photo Section - Redesigned ✨

## What Changed

Redesigned the Profile Photo upload section to match your design specifications with a circular preview and cleaner layout.

## New Design Features

### Layout
- **Circular Photo Preview** (128px diameter)
  - Gray background with camera icon when empty
  - Shows uploaded photo inside the circle
  - 4px border for better definition
  - Professional, clean appearance

- **Side-by-Side Layout**
  - Photo circle on the left
  - Upload button and description on the right
  - Better use of horizontal space
  - More intuitive user experience

### Upload Button
- White background with gray border
- "Upload Photo" text (changes to "Change Photo" when photo exists)
- Hover effects for better interactivity
- Disabled state during upload

### Description Text
- "Professional headshot. Smile, good lighting, plain background."
- Positioned below the upload button
- Gray color for subtle guidance

### Upload Progress
- Circular spinner overlay on the photo circle
- Shows upload percentage
- Semi-transparent black background
- Non-intrusive progress indicator

### Success Indicator
- Green checkmark with filename
- Appears below the description
- Confirms successful upload

## Component Structure

Created new component: `components/onboarding/ProfilePhotoInput.tsx`

**Features:**
- Circular preview with camera icon placeholder
- Upload progress overlay
- Draft restoration support
- File validation (5MB limit, images only)
- Toast notifications for success/error
- Automatic preview generation
- Memory cleanup (revokes object URLs)

## Visual States

### 1. Empty State
```
┌─────────────┐
│   ┌─────┐   │  Upload Photo
│   │ 📷  │   │  Professional headshot. Smile, good lighting...
│   └─────┘   │
└─────────────┘
```

### 2. Uploading State
```
┌─────────────┐
│   ┌─────┐   │  Upload Photo
│   │ ⟳ 45%│   │  Professional headshot. Smile, good lighting...
│   └─────┘   │
└─────────────┘
```

### 3. Photo Selected
```
┌─────────────┐
│   ┌─────┐   │  Change Photo
│   │ 👤  │   │  Professional headshot. Smile, good lighting...
│   └─────┘   │  ✓ profile-photo.jpg
└─────────────┘
```

### 4. Draft Available
```
[Draft found: profile-photo.jpg | Restore]

┌─────────────┐
│   ┌─────┐   │  Upload Photo
│   │ 📷  │   │  Professional headshot. Smile, good lighting...
│   └─────┘   │
└─────────────┘
```

## Technical Details

### Props
- `value`: Current file (File | null)
- `draftMetadata`: Draft information from database
- `onChange`: Callback when file changes
- `onDraftRestore`: Callback to restore draft
- `clerkUserId`: User ID for upload

### Validation
- Max file size: 5MB
- Accepted formats: image/*, .heic, .heif
- Client-side validation with user-friendly errors

### Upload Flow
1. User clicks "Upload Photo" button
2. File picker opens
3. User selects image
4. Preview appears in circle immediately
5. Upload starts in background
6. Progress shown as overlay
7. Success toast appears
8. Button changes to "Change Photo"

### Draft Restoration
1. Blue banner appears if draft exists
2. User clicks "Restore" button
3. File fetched from server
4. Preview appears in circle
5. Draft banner disappears
6. Ready to submit

## Files Modified

1. **Created**: `components/onboarding/ProfilePhotoInput.tsx`
   - New custom component for profile photo
   - Circular preview design
   - Upload progress overlay
   - Draft restoration support

2. **Modified**: `app/onboarding/tutor/page.tsx`
   - Imported ProfilePhotoInput component
   - Replaced DraftFileInput with ProfilePhotoInput
   - Maintained all existing functionality

## Benefits

✅ **Better Visual Hierarchy**
- Circular photo draws attention
- Clear call-to-action button
- Professional appearance

✅ **Improved User Experience**
- Immediate visual feedback
- Clear upload progress
- Intuitive layout

✅ **Consistent with Design**
- Matches your reference image
- Professional and clean
- Modern UI patterns

✅ **Maintains Functionality**
- Draft system still works
- Upload progress tracking
- Error handling
- File validation

## Test It Now

1. Go to `/onboarding/tutor`
2. Navigate to Step 5 (Profile Media)
3. You should see:
   - Gray circular placeholder with camera icon
   - "Upload Photo" button to the right
   - Description text below button
4. Click "Upload Photo" and select an image
5. Watch the preview appear in the circle
6. See the upload progress overlay
7. Button changes to "Change Photo"

The profile photo section now matches your design perfectly! 🎉
