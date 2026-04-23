-- ==============================================
-- DATABASE MIGRATION: Check Invalid IC Formats
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script checks which users have IC numbers that don't match the correct format
-- Run this BEFORE migration_fix_invalid_ic_formats.sql to see what will be changed

-- Find all users with invalid IC formats
SELECT 
    u.ic as 'Current IC',
    u.nama as 'Name',
    u.role as 'Role',
    u.telefon as 'Phone',
    LENGTH(REPLACE(u.ic, '-', '')) as 'IC Length',
    CASE 
        WHEN LENGTH(REPLACE(u.ic, '-', '')) != 12 THEN 'Wrong Length'
        WHEN NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$') THEN 'Invalid Characters'
        ELSE 'Valid'
    END as 'Issue',
    s.kelas_id as 'Class ID',
    c.nama_kelas as 'Class Name'
FROM users u
LEFT JOIN students s ON u.ic = s.user_ic
LEFT JOIN classes c ON s.kelas_id = c.id
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
ORDER BY u.role, u.nama;

-- Count by role
SELECT 
    u.role as 'Role',
    COUNT(*) as 'Count of Invalid ICs'
FROM users u
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
GROUP BY u.role;

-- Show specific problematic ICs
SELECT 
    'Problematic ICs' as 'Section',
    GROUP_CONCAT(DISTINCT ic ORDER BY ic SEPARATOR ', ') as 'Invalid IC List'
FROM users
WHERE LENGTH(REPLACE(ic, '-', '')) != 12
   OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$');

