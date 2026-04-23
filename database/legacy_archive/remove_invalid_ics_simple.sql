-- Simple script to remove ALL invalid IC numbers
-- Valid format ONLY: XXXXXX-XX-XXXX (12 digits with hyphens)
-- This removes: T0-prefixed, any starting with non-digits, wrong format

SET FOREIGN_KEY_CHECKS = 0;

-- Show what will be deleted
SELECT 'BEFORE: Invalid ICs to be removed' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;

-- Delete from all related tables
DELETE FROM staff_checkin WHERE staff_ic LIKE 'T0%' OR staff_ic REGEXP '^[^0-9]' OR (staff_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(staff_ic, '-', '')) != 12);
DELETE FROM user_roles WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM fees WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
DELETE FROM results WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
DELETE FROM attendance WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
UPDATE classes SET guru_ic = NULL WHERE guru_ic LIKE 'T0%' OR guru_ic REGEXP '^[^0-9]' OR (guru_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(guru_ic, '-', '')) != 12);
DELETE FROM teachers WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM students WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM users WHERE ic LIKE 'T0%' OR ic REGEXP '^[^0-9]' OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12);

SET FOREIGN_KEY_CHECKS = 1;

-- Verification
SELECT 'AFTER: Remaining invalid ICs (should be empty)' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;

-- Statistics
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format_ics,
    COUNT(CASE WHEN ic LIKE 'T0%' THEN 1 END) as remaining_t0_ics
FROM users;

SELECT 'Cleanup completed!' as status;

