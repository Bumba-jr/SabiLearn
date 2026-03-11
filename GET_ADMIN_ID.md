# How to Get Your Admin User ID

## Method 1: Browser Console (Easiest)

1. Sign in to your application
2. Open browser developer tools (F12 or Right-click → Inspect)
3. Go to the Console tab
4. Paste this code and press Enter:

```javascript
console.log('Your Clerk User ID:', window.Clerk?.user?.id);
```

5. Copy the user ID (format: `user_xxxxxxxxxxxxx`)

## Method 2: From Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "Users" section
4. Click on your user account
5. Copy the "User ID" from the user details

## Method 3: Add Debug Component

Create a temporary component to display your ID:

```tsx
// app/get-id/page.tsx
'use client';

import { useUser } from '@clerk/nextjs';

export default function GetIdPage() {
    const { user } = useUser();
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                <h1 className="text-2xl font-bold mb-4">Your Clerk User ID</h1>
                {user ? (
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Copy this ID:</p>
                        <code className="block bg-gray-100 p-4 rounded text-sm break-all">
                            {user.id}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(user.id)}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}
```

Then visit `/get-id` in your browser.

## Setting Up Admin Access

Once you have your User ID:

1. Open `.env.local`
2. Find or add this line:
   ```env
   ADMIN_USER_ID=user_your_actual_id_here
   ```
3. Replace `user_your_actual_id_here` with your actual Clerk user ID
4. Save the file
5. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   pnpm dev
   ```
6. Navigate to `/admin`

## Troubleshooting

### Still Can't Access?

1. **Check the environment variable is set correctly**
   - Open `.env.local`
   - Verify `ADMIN_USER_ID` has your actual user ID
   - No quotes needed around the value

2. **Restart the server**
   - Environment variables are only loaded on server start
   - Stop the server completely (Ctrl+C)
   - Start it again with `pnpm dev`

3. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cookies for localhost

4. **Check browser console**
   - Open developer tools (F12)
   - Look for any error messages
   - Check Network tab for 403 responses

5. **Verify you're signed in**
   - Make sure you're logged into the application
   - The user ID must match your logged-in account

### See "Access Denied" Page?

If you see the "Access Denied" page, it will show your current User ID. Copy that ID and add it to `.env.local` as `ADMIN_USER_ID`.

## Adding Multiple Admins

To give admin access to multiple users:

1. Open `app/api/admin/users/route.ts`
2. Find the `ADMIN_USER_IDS` array
3. Add more user IDs:

```typescript
const ADMIN_USER_IDS = [
    process.env.ADMIN_USER_ID || '',
    'user_second_admin_id',
    'user_third_admin_id',
];
```

4. Repeat for:
   - `app/api/admin/verify/route.ts`
   - `app/api/admin/stats/route.ts`

5. Restart the server
