-- ==============================================
-- DATABASE MIGRATION: Fix Invalid IC Formats (Simplified Version)
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script finds users with IC numbers that don't match the correct format (12 digits)
-- and updates them to valid 12-digit ICs, updating all related tables.

-- ====================================================
-- STEP 1: Create a temporary table to store IC mappings
-- ====================================================
DROP TEMPORARY TABLE IF EXISTS ic_mappings;
CREATE TEMPORARY TABLE ic_mappings (
    row_num INT AUTO_INCREMENT PRIMARY KEY,
    old_ic VARCHAR(20),
    new_ic VARCHAR(20),
    new_ic_formatted VARCHAR(20),
    UNIQUE KEY (old_ic)
);

-- ====================================================
-- STEP 2: Find users with invalid IC formats and generate new ICs
-- ====================================================
-- Insert invalid ICs into mappings (row_num will auto-increment)
INSERT INTO ic_mappings (old_ic)
SELECT u.ic
FROM users u
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
ORDER BY u.ic;

-- Generate unique new ICs
-- Format: 99 (prefix) + YYMM (year/month) + 6-digit sequential number
SET @base_prefix = CONCAT('99', DATE_FORMAT(NOW(), '%y%m'));
SET @start_counter = COALESCE((
    SELECT MAX(CAST(SUBSTRING(REPLACE(ic, '-', ''), 7) AS UNSIGNED))
    FROM users 
    WHERE REPLACE(ic, '-', '') LIKE CONCAT(@base_prefix, '%')
      AND LENGTH(REPLACE(ic, '-', '')) = 12
), 0);

-- Update with new ICs using the row_num
UPDATE ic_mappings
SET 
    new_ic = CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')),
    new_ic_formatted = CONCAT(
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 1, 6),
        '-',
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 7, 2),
        '-',
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 9, 4)
    );

-- ====================================================
-- STEP 3: Display the mappings (for verification)
-- ====================================================
SELECT 
    m.old_ic as 'Old IC',
    m.new_ic_formatted as 'New IC',
    u.nama as 'Name',
    u.role as 'Role'
FROM ic_mappings m
JOIN users u ON u.ic = m.old_ic
ORDER BY u.role, u.nama;

-- ====================================================
-- STEP 4: Update all related tables
-- ====================================================

-- Disable foreign key checks temporarily for updates
SET FOREIGN_KEY_CHECKS = 0;

-- Update students table
UPDATE students s
JOIN ic_mappings m ON s.user_ic = m.old_ic
SET s.user_ic = m.new_ic_formatted;

-- Update teachers table
UPDATE teachers t
JOIN ic_mappings m ON t.user_ic = m.old_ic
SET t.user_ic = m.new_ic_formatted;

-- Update classes table (guru_ic)
UPDATE classes c
JOIN ic_mappings m ON c.guru_ic = m.old_ic
SET c.guru_ic = m.new_ic_formatted;

-- Update attendance table (student_ic, marked_by)
UPDATE attendance a
JOIN ic_mappings m ON a.student_ic = m.old_ic
SET a.student_ic = m.new_ic_formatted;

UPDATE attendance a
JOIN ic_mappings m ON a.marked_by = m.old_ic
SET a.marked_by = m.new_ic_formatted;

-- Update results table (student_ic)
UPDATE results r
JOIN ic_mappings m ON r.student_ic = m.old_ic
SET r.student_ic = m.new_ic_formatted;

-- Update fees table (student_ic)
UPDATE fees f
JOIN ic_mappings m ON f.student_ic = m.old_ic
SET f.student_ic = m.new_ic_formatted;

-- Update user_roles table (user_ic)
UPDATE user_roles ur
JOIN ic_mappings m ON ur.user_ic = m.old_ic
SET ur.user_ic = m.new_ic_formatted;

-- Update pending_pic_changes table (created_by, approved_by)
UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.created_by = m.old_ic
SET ppc.created_by = m.new_ic_formatted;

UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.approved_by = m.old_ic
SET ppc.approved_by = m.new_ic_formatted;

-- Update admin_action_snapshots table (actor_ic)
UPDATE admin_action_snapshots aas
JOIN ic_mappings m ON aas.actor_ic = m.old_ic
SET aas.actor_ic = m.new_ic_formatted;

-- Update announcements table (author_ic) - if exists
UPDATE announcements a
JOIN ic_mappings m ON a.author_ic = m.old_ic
SET a.author_ic = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'announcements' 
              AND column_name = 'author_ic');

-- Update payments table (student_ic, created_by) - if exists
UPDATE payments p
JOIN ic_mappings m ON p.student_ic = m.old_ic
SET p.student_ic = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'payments' 
              AND column_name = 'student_ic');

UPDATE payments p
JOIN ic_mappings m ON p.created_by = m.old_ic
SET p.created_by = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'payments' 
              AND column_name = 'created_by');

-- ====================================================
-- STEP 5: Update users table (primary key update)
-- ====================================================
-- Insert new user records with updated ICs
INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status, created_at, updated_at)
SELECT 
    m.new_ic_formatted as ic,
    u.nama,
    u.umur,
    u.alamat,
    u.telefon,
    u.email,
    u.password,
    u.role,
    u.status,
    u.created_at,
    NOW() as updated_at
FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;

-- Delete old user records
DELETE u FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- STEP 6: Verify the changes
-- ====================================================
SELECT 
    'Summary' as 'Section',
    COUNT(*) as 'Total Users Fixed'
FROM ic_mappings;

-- Show remaining invalid ICs (should be 0)
SELECT 
    'Validation' as 'Section',
    COUNT(*) as 'Users with Invalid IC Format',
    GROUP_CONCAT(ic SEPARATOR ', ') as 'Invalid ICs'
FROM users
WHERE LENGTH(REPLACE(ic, '-', '')) != 12
   OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$');

-- Clean up temporary table
DROP TEMPORARY TABLE ic_mappings;

-- ====================================================
-- NOTES:
-- 1. This script generates new 12-digit ICs in format: 99YYMMNNNNNN
-- 2. All foreign key relationships are preserved
-- 3. Backup your database before running this script
-- 4. Test on a development/staging environment first
-- ====================================================

