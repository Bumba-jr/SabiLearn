-- Cleanup script for duplicate and orphaned user records
-- Run this in Supabase SQL Editor

-- 1. Find profiles without auth_user_id
SELECT 'Profiles without auth_user_id:' as info;
SELECT id, role, created_at, clerk_user_id
FROM profiles
WHERE auth_user_id IS NULL;

-- 2. Find tutors without auth_user_id
SELECT 'Tutors without auth_user_id:' as info;
SELECT id, name, email, created_at
FROM tutors
WHERE auth_user_id IS NULL;

-- 3. Find duplicate profiles (same auth_user_id)
SELECT 'Duplicate profiles (same auth_user_id):' as info;
SELECT auth_user_id, COUNT(*) as count
FROM profiles
WHERE auth_user_id IS NOT NULL
GROUP BY auth_user_id
HAVING COUNT(*) > 1;

-- 4. Find duplicate tutors (same auth_user_id)
SELECT 'Duplicate tutors (same auth_user_id):' as info;
SELECT auth_user_id, COUNT(*) as count
FROM tutors
WHERE auth_user_id IS NOT NULL
GROUP BY auth_user_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- CLEANUP ACTIONS (uncomment to execute)
-- ============================================================================

-- Option 1: Delete profiles without auth_user_id
-- WARNING: This will permanently delete these records
-- DELETE FROM profiles WHERE auth_user_id IS NULL;

-- Option 2: Delete tutors without auth_user_id
-- WARNING: This will permanently delete these records
-- DELETE FROM tutors WHERE auth_user_id IS NULL;

-- Option 3: Keep only the most recent profile for each auth_user_id
-- This deletes older duplicate profiles
/*
DELETE FROM profiles
WHERE id IN (
    SELECT p1.id
    FROM profiles p1
    INNER JOIN profiles p2 ON p1.auth_user_id = p2.auth_user_id
    WHERE p1.created_at < p2.created_at
);
*/

-- Option 4: Keep only the most recent tutor for each auth_user_id
-- This deletes older duplicate tutors
/*
DELETE FROM tutors
WHERE id IN (
    SELECT t1.id
    FROM tutors t1
    INNER JOIN tutors t2 ON t1.auth_user_id = t2.auth_user_id
    WHERE t1.created_at < t2.created_at
);
*/

-- Option 5: Delete students without auth_user_id
-- DELETE FROM students WHERE auth_user_id IS NULL;

-- After cleanup, verify the results
SELECT 'Final counts:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE auth_user_id IS NULL) as profiles_without_auth,
    (SELECT COUNT(*) FROM tutors) as total_tutors,
    (SELECT COUNT(*) FROM tutors WHERE auth_user_id IS NULL) as tutors_without_auth,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM students WHERE auth_user_id IS NULL) as students_without_auth;
