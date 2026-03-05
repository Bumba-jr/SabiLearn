# Requirements Document

## Introduction

This document specifies the requirements for a complete authentication and onboarding system for SabiLearn, a tutoring marketplace connecting students, parents, and tutors in Nigeria. The system integrates Clerk for authentication, Supabase for data persistence, and provides role-based onboarding flows that guide users through a one-time setup process before accessing their role-specific dashboards.

## Glossary

- **Authentication_System**: Clerk-based authentication service handling user identity verification
- **Onboarding_Flow**: Multi-step process collecting role-specific information from new users
- **Role_Selection_Screen**: UI component displaying three role options (Tutor, Student, Parent)
- **Profile_Record**: Database entry in Supabase profiles table containing user role and onboarding status
- **Dashboard**: Role-specific landing page users access after completing onboarding
- **Session**: Clerk-managed authentication state tracking logged-in users
- **Middleware**: Server-side code verifying authentication and authorization
- **Onboarding_Progress**: Partially completed onboarding data saved for resumption
- **Role_Lock**: Permanent assignment of user role after onboarding completion

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to authenticate using email/password or Google, so that I can securely access the SabiLearn platform.

#### Acceptance Criteria

1. WHEN a user clicks "Become a Tutor" or "Log in", THE Authentication_System SHALL redirect the user to the Clerk authentication page
2. THE Authentication_System SHALL support email and password authentication
3. THE Authentication_System SHALL support Google social login
4. WHEN authentication succeeds, THE Authentication_System SHALL generate a session token
5. THE Authentication_System SHALL manage session persistence across page refreshes
6. WHEN authentication fails, THE Authentication_System SHALL display an error message from Clerk

### Requirement 2: First-Time User Role Selection

**User Story:** As a first-time user, I want to select my role (Tutor, Student, or Parent), so that I receive the appropriate onboarding experience.

#### Acceptance Criteria

1. WHEN a user completes authentication for the first time, THE System SHALL display the Role_Selection_Screen
2. THE Role_Selection_Screen SHALL display three interactive cards with icons, titles, and descriptions for Tutor, Student, and Parent roles
3. WHEN a user hovers over a role card, THE System SHALL display hover state styling
4. WHEN a user clicks a role card, THE System SHALL display selection state styling
5. THE System SHALL require the user to select exactly one role before proceeding
6. WHEN a user confirms role selection, THE System SHALL create a Profile_Record in Supabase with the selected role and onboarding_completed set to false
7. WHEN the Profile_Record is created, THE System SHALL redirect the user to the role-specific Onboarding_Flow
8. FOR ALL users who have completed onboarding, THE Role_Selection_Screen SHALL never display again

### Requirement 3: Tutor Onboarding Flow

**User Story:** As a tutor, I want to complete a comprehensive onboarding process, so that I can create a complete profile and start offering tutoring services.

#### Acceptance Criteria

1. WHEN a user selects the Tutor role, THE System SHALL display the tutor Onboarding_Flow
2. THE Onboarding_Flow SHALL collect subjects taught
3. THE Onboarding_Flow SHALL collect experience level
4. THE Onboarding_Flow SHALL collect grade levels taught
5. THE Onboarding_Flow SHALL collect a bio text field
6. THE Onboarding_Flow SHALL collect a profile photo upload
7. THE Onboarding_Flow SHALL collect an intro video upload
8. THE Onboarding_Flow SHALL collect credentials upload (degree or teaching license)
9. THE Onboarding_Flow SHALL collect bank payment details
10. THE Onboarding_Flow SHALL collect availability schedule
11. WHEN all required fields are completed, THE System SHALL enable the completion button
12. WHEN the user completes onboarding, THE System SHALL save all data to the tutors table in Supabase
13. WHEN the user completes onboarding, THE System SHALL set onboarding_completed to true in the Profile_Record
14. WHEN onboarding is complete, THE System SHALL redirect the user to /dashboard/tutor

### Requirement 4: Student Onboarding Flow

**User Story:** As a student, I want to complete an onboarding process, so that I can find tutors matching my learning needs.

#### Acceptance Criteria

1. WHEN a user selects the Student role, THE System SHALL display the student Onboarding_Flow
2. THE Onboarding_Flow SHALL collect the student's grade level
3. THE Onboarding_Flow SHALL collect subjects needed
4. THE Onboarding_Flow SHALL collect learning goals
5. THE Onboarding_Flow SHALL collect preferred learning mode (online or home tutoring)
6. IF the student is a minor, THE Onboarding_Flow SHALL collect parent contact information
7. WHEN all required fields are completed, THE System SHALL enable the completion button
8. WHEN the user completes onboarding, THE System SHALL save all data to the students table in Supabase
9. WHEN the user completes onboarding, THE System SHALL set onboarding_completed to true in the Profile_Record
10. WHEN onboarding is complete, THE System SHALL redirect the user to /dashboard/student

### Requirement 5: Parent Onboarding Flow

**User Story:** As a parent, I want to complete an onboarding process, so that I can find tutors for my child.

#### Acceptance Criteria

1. WHEN a user selects the Parent role, THE System SHALL display the parent Onboarding_Flow
2. THE Onboarding_Flow SHALL collect the child's name
3. THE Onboarding_Flow SHALL collect the child's grade level
4. THE Onboarding_Flow SHALL collect subjects needed
5. THE Onboarding_Flow SHALL collect preferred schedule
6. THE Onboarding_Flow SHALL collect location for home tutoring
7. WHEN all required fields are completed, THE System SHALL enable the completion button
8. WHEN the user completes onboarding, THE System SHALL save all data to the parents table in Supabase
9. WHEN the user completes onboarding, THE System SHALL set onboarding_completed to true in the Profile_Record
10. WHEN onboarding is complete, THE System SHALL redirect the user to /dashboard/parent

### Requirement 6: Onboarding Navigation and Role Changes

**User Story:** As a user during onboarding, I want to navigate back and change my role selection, so that I can correct mistakes before completing the process.

#### Acceptance Criteria

1. WHILE onboarding_completed is false, THE System SHALL allow the user to navigate back to the Role_Selection_Screen
2. WHILE onboarding_completed is false, THE System SHALL allow the user to change their selected role
3. WHEN a user changes their role before completion, THE System SHALL update the role field in the Profile_Record
4. WHEN a user changes their role before completion, THE System SHALL discard any partially completed onboarding data from the previous role
5. WHEN onboarding_completed is true, THE System SHALL prevent navigation to the Role_Selection_Screen
6. WHEN onboarding_completed is true, THE System SHALL enforce the Role_Lock permanently

### Requirement 7: Returning User Login Flow

**User Story:** As a returning user, I want to be redirected to my appropriate dashboard, so that I can quickly access my account.

#### Acceptance Criteria

1. WHEN a returning user authenticates, THE System SHALL query Supabase for the user's Profile_Record
2. IF onboarding_completed is true AND role is Tutor, THE System SHALL redirect to /dashboard/tutor
3. IF onboarding_completed is true AND role is Student, THE System SHALL redirect to /dashboard/student
4. IF onboarding_completed is true AND role is Parent, THE System SHALL redirect to /dashboard/parent
5. IF onboarding_completed is false, THE System SHALL redirect to the incomplete Onboarding_Flow
6. THE System SHALL never display the Role_Selection_Screen to users with an assigned role

### Requirement 8: Database Schema and Data Persistence

**User Story:** As the system, I want to persist user profiles and role-specific data, so that user information is retained across sessions.

#### Acceptance Criteria

1. THE System SHALL maintain a profiles table with columns: id, clerk_user_id, role, onboarding_completed, created_at
2. THE System SHALL maintain a tutors table linked to profiles via clerk_user_id
3. THE System SHALL maintain a students table linked to profiles via clerk_user_id
4. THE System SHALL maintain a parents table linked to profiles via clerk_user_id
5. THE System SHALL use clerk_user_id as the foreign key linking profiles to role-specific tables
6. WHEN a Profile_Record is created, THE System SHALL set onboarding_completed to false by default
7. THE System SHALL enforce that role values are restricted to the enum: Tutor, Student, Parent
8. THE System SHALL ensure clerk_user_id is unique in the profiles table

### Requirement 9: Onboarding Progress Persistence

**User Story:** As a user, I want my onboarding progress to be saved automatically, so that I can resume where I left off if I leave the page.

#### Acceptance Criteria

1. WHILE a user is completing the Onboarding_Flow, THE System SHALL auto-save form data to Supabase every 30 seconds
2. WHEN a user refreshes the page during onboarding, THE System SHALL restore the saved Onboarding_Progress
3. WHEN a user logs out during onboarding, THE System SHALL preserve the Onboarding_Progress
4. WHEN a user logs back in with incomplete onboarding, THE System SHALL resume the Onboarding_Flow with saved progress
5. WHEN onboarding is completed, THE System SHALL mark the Onboarding_Progress as finalized

### Requirement 10: Security and Authorization

**User Story:** As the system, I want to enforce role-based access control, so that users can only access dashboards and features appropriate to their role.

#### Acceptance Criteria

1. THE Middleware SHALL verify the Clerk Session for all protected routes
2. THE Middleware SHALL query Supabase to retrieve the user's role from the Profile_Record
3. WHEN a user attempts to access /dashboard/tutor, THE Middleware SHALL verify the user's role is Tutor
4. WHEN a user attempts to access /dashboard/student, THE Middleware SHALL verify the user's role is Student
5. WHEN a user attempts to access /dashboard/parent, THE Middleware SHALL verify the user's role is Parent
6. IF a user attempts to access a dashboard not matching their role, THE Middleware SHALL redirect to their correct dashboard
7. IF a user attempts to access a dashboard without authentication, THE Middleware SHALL redirect to the Clerk login page
8. WHEN onboarding_completed is true, THE System SHALL prevent any modifications to the role field in the Profile_Record

### Requirement 11: User Interface and Experience

**User Story:** As a user, I want a smooth and responsive interface, so that I have a pleasant onboarding experience.

#### Acceptance Criteria

1. THE System SHALL display loading states during page transitions
2. THE System SHALL display loading states during authentication redirects
3. THE System SHALL display a progress indicator showing completion percentage during the Onboarding_Flow
4. THE System SHALL validate all form fields before allowing submission
5. THE System SHALL display inline validation errors for invalid form inputs
6. THE System SHALL use smooth page transitions between onboarding steps
7. WHERE the user is on a mobile device, THE System SHALL display a mobile-optimized layout
8. THE System SHALL use Tailwind CSS and shadcn/ui components for consistent styling

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a user, I want the system to handle errors gracefully, so that I can recover from issues without losing my progress.

#### Acceptance Criteria

1. IF a network failure occurs during onboarding, THE System SHALL display a retry UI with an option to attempt the operation again
2. IF a network failure occurs during auto-save, THE System SHALL queue the save operation for retry when connectivity is restored
3. WHEN a user refreshes during onboarding, THE System SHALL restore progress without data loss
4. THE System SHALL prevent duplicate Profile_Record creation for the same clerk_user_id
5. THE System SHALL prevent duplicate role assignment in role-specific tables
6. IF Supabase is unavailable, THE System SHALL display an error message and prevent progression until connectivity is restored
7. IF Clerk authentication fails, THE System SHALL display the Clerk error message and allow retry

### Requirement 13: Role Selection Card Interactions

**User Story:** As a user, I want clear visual feedback when selecting my role, so that I understand which role I'm choosing.

#### Acceptance Criteria

1. THE Role_Selection_Screen SHALL display a card for Tutor with icon 🧑‍🏫, title "Tutor", and a description
2. THE Role_Selection_Screen SHALL display a card for Student with icon 🎓, title "Student", and a description
3. THE Role_Selection_Screen SHALL display a card for Parent with icon 👨‍👩‍👧, title "Parent", and a description
4. WHEN a user hovers over a role card, THE System SHALL apply hover state styling with border highlight
5. WHEN a user clicks a role card, THE System SHALL apply selection state styling with background color change
6. WHEN a user clicks a selected role card again, THE System SHALL deselect the card
7. THE System SHALL display a "Continue" button that is disabled until a role is selected
8. WHEN a role is selected, THE System SHALL enable the "Continue" button

### Requirement 14: Form Validation Rules

**User Story:** As a user, I want clear validation feedback, so that I know what information is required and in what format.

#### Acceptance Criteria

1. THE System SHALL validate that email fields contain valid email addresses
2. THE System SHALL validate that required text fields are not empty
3. THE System SHALL validate that file uploads are in accepted formats (JPEG, PNG for photos; MP4 for videos; PDF for credentials)
4. THE System SHALL validate that file uploads do not exceed 10MB for photos, 50MB for videos, and 5MB for credentials
5. WHEN a validation error occurs, THE System SHALL display an error message below the invalid field
6. THE System SHALL prevent form submission while validation errors exist
7. THE System SHALL display a checkmark icon next to valid fields after validation

### Requirement 15: Dashboard Redirection After Completion

**User Story:** As a user, I want to be automatically redirected to my dashboard after completing onboarding, so that I can immediately start using the platform.

#### Acceptance Criteria

1. WHEN a Tutor completes onboarding, THE System SHALL redirect to /dashboard/tutor within 2 seconds
2. WHEN a Student completes onboarding, THE System SHALL redirect to /dashboard/student within 2 seconds
3. WHEN a Parent completes onboarding, THE System SHALL redirect to /dashboard/parent within 2 seconds
4. THE System SHALL display a success message during the redirect
5. THE System SHALL display a loading animation during the redirect

