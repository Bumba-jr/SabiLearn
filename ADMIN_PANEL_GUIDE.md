# Admin Panel Guide

## Overview
The admin panel provides a centralized dashboard for managing users and verifying tutors on the SabiLearn platform.

## Access

### URL
`/admin`

### Authentication
Only users with their Clerk User ID listed in the `ADMIN_USER_ID` environment variable can access the admin panel.

### Setup Admin Access

1. Get your Clerk User ID:
   - Sign in to your application
   - Open browser console
   - Run: `console.log(window.Clerk.user.id)`
   - Copy the user ID (format: `user_xxxxxxxxxxxxx`)

2. Add to environment variables:
   ```env
   ADMIN_USER_ID=user_your_actual_clerk_id_here
   ```

3. Restart your development server

4. Navigate to `/admin`

## Features

### Dashboard Statistics
The admin panel displays key metrics at the top:

- **Total Users**: All registered users across all roles
- **Total Tutors**: Number of tutor accounts
- **Verified Tutors**: Number of verified tutor accounts
- **Total Students**: Number of student accounts
- **Pending Verifications**: Tutors awaiting verification

### User Management

#### Search & Filter
- **Search**: Find users by name, email, or Clerk user ID
- **Role Filter**: Filter by role (All, Tutors, Students, Parents)
- **Status Filter**: Filter by verification status (All, Verified, Unverified)

#### User Table Columns
1. **User**: Avatar, name, and email
2. **Role**: User role badge (Tutor/Student/Parent)
3. **Status**: Verification status (Verified/Unverified)
4. **Onboarding**: Completion status
5. **Joined**: Registration date
6. **Actions**: Verification controls and view button

### Verification Actions

#### Verify Tutor
- Click "Verify" button next to unverified tutor
- Updates `is_verified` field in tutors table
- Verified tutors appear in public tutor search

#### Unverify Tutor
- Click "Unverify" button next to verified tutor
- Removes verification status
- Tutor will not appear in public search

## API Endpoints

### GET /api/admin/stats
Returns dashboard statistics.

**Response:**
```json
{
  "stats": {
    "totalUsers": 150,
    "totalTutors": 75,
    "verifiedTutors": 50,
    "totalStudents": 70,
    "pendingVerifications": 25
  }
}
```

### GET /api/admin/users
Returns list of users with optional filters.

**Query Parameters:**
- `role`: Filter by role (tutor, student, parent)
- `verified`: Filter by verification status (true, false)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "clerk_user_id": "user_xxx",
      "role": "tutor",
      "name": "John Doe",
      "email": "john@example.com",
      "is_verified": true,
      "onboarding_completed": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/verify
Updates user verification status.

**Request Body:**
```json
{
  "clerkUserId": "user_xxx",
  "role": "tutor",
  "verified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User verified successfully"
}
```

## Security

### Authorization
- All admin API routes check if the requesting user's ID is in `ADMIN_USER_IDS`
- Returns 403 Forbidden if unauthorized
- Uses Clerk's `auth()` function to get current user ID

### Database Access
- Admin APIs use `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
- Can bypass Row Level Security policies
- Should only be accessible to admin users

### Multiple Admins
To add multiple admin users, update the API routes:

```typescript
const ADMIN_USER_IDS = [
    process.env.ADMIN_USER_ID,
    'user_second_admin_id',
    'user_third_admin_id',
];
```

## Database Schema

### Verification Fields

**Tutors Table:**
- `is_verified` (boolean): Verification status
- `is_available` (boolean): Availability status

**Students Table:**
- `is_verified` (boolean): Verification status (optional)

### Profiles Table
- `clerk_user_id` (text): Links to Clerk authentication
- `role` (text): User role (tutor, student, parent)
- `onboarding_completed` (boolean): Onboarding status

## Workflow

### Typical Verification Process

1. **Tutor Signs Up**
   - Creates account via Clerk
   - Completes onboarding
   - Profile created with `is_verified: false`

2. **Admin Reviews**
   - Admin logs into `/admin`
   - Filters for unverified tutors
   - Reviews tutor credentials and information

3. **Admin Verifies**
   - Clicks "Verify" button
   - Tutor's `is_verified` set to `true`
   - Tutor now appears in public search

4. **Tutor Goes Live**
   - Verified tutor visible on `/find-tutors`
   - Can receive bookings from students

## Future Enhancements

### Planned Features
- [ ] View detailed user profiles in modal
- [ ] Bulk verification actions
- [ ] User activity logs
- [ ] Email notifications for verification
- [ ] Document review interface
- [ ] Suspension/ban functionality
- [ ] Export user data to CSV
- [ ] Advanced analytics dashboard
- [ ] User messaging system
- [ ] Verification notes/comments

### Suggested Improvements
- Add pagination for large user lists
- Implement real-time updates with WebSockets
- Add audit trail for admin actions
- Create verification workflow with stages
- Add document upload review interface
- Implement automated verification checks

## Troubleshooting

### Cannot Access Admin Panel
1. Verify your Clerk user ID is correct
2. Check `ADMIN_USER_ID` in `.env.local`
3. Restart development server
4. Clear browser cache and cookies

### Users Not Showing
1. Check database connection
2. Verify Supabase credentials
3. Check browser console for errors
4. Verify RLS policies allow service role access

### Verification Not Working
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. Verify tutors table has `is_verified` column
3. Check browser console for API errors
4. Verify user has correct role in database

## Support

For issues or questions:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify environment variables are set
4. Ensure database migrations are applied
