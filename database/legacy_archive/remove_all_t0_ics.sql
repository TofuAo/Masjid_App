-- Script to remove all invalid IC numbers
-- Valid format: XXXXXX-XX-XXXX (12 digits with hyphens) or 12 digits without hyphens
-- Invalid formats include: T0-prefixed, letters, wrong length, etc.
-- Run this script to clean up the database

SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Show what will be deleted
-- Invalid ICs: T0-prefixed, starting with non-digits, or not matching XXXXXX-XX-XXXX format
SELECT 'BEFORE DELETION - Invalid ICs found:' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'  -- Starts with non-digit
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)  -- Wrong format
ORDER BY ic;

-- Step 2: Delete from all related tables
-- Delete from child tables first (due to foreign key constraints)
-- Remove ALL invalid ICs (T0-prefixed, non-digit starting, wrong format)

-- Step 2: Delete from all related tables
-- Delete from child tables first (due to foreign key constraints)
-- Remove ALL invalid ICs: T0-prefixed, starting with non-digits, or wrong format

-- Delete from staff_checkin
DELETE FROM staff_checkin 
WHERE staff_ic LIKE 'T0%' 
   OR staff_ic REGEXP '^[^0-9]'
   OR (staff_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(staff_ic, '-', '')) != 12);

-- Delete from user_roles
DELETE FROM user_roles 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);

-- Delete from fees
DELETE FROM fees 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);

-- Delete from results
DELETE FROM results 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);

-- Delete from attendance
DELETE FROM attendance 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);

-- Delete from classes (set guru_ic to NULL for invalid ICs)
UPDATE classes 
SET guru_ic = NULL 
WHERE guru_ic LIKE 'T0%' 
   OR guru_ic REGEXP '^[^0-9]'
   OR (guru_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(guru_ic, '-', '')) != 12);

-- Delete from teachers
DELETE FROM teachers 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);

-- Delete from students
DELETE FROM students 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);

-- Finally, delete from users table
DELETE FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12);

SET FOREIGN_KEY_CHECKS = 1;

-- Step 3: Verification
SELECT 'AFTER DELETION - Remaining invalid ICs:' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;

-- Show statistics
SELECT 
    'STATISTICS' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN ic LIKE 'T0%' THEN 1 END) as remaining_t0_ics,
    COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format,
    COUNT(CASE WHEN LENGTH(REPLACE(ic, '-', '')) = 12 AND ic REGEXP '^[0-9]' THEN 1 END) as valid_12_digit_ics
FROM users;

SELECT 'Cleanup completed!' as status;

