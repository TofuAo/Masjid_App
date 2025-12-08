-- Complete fix for USTAZ A.ZUNNOR BIN ABD RAHMAN IC
-- Change from T0139046113 to 710515-06-5193

USE masjid_app;

START TRANSACTION;

-- Step 1: Update users table (handle all possible old IC formats)
UPDATE users 
SET ic = '710515-06-5193', updated_at = CURRENT_TIMESTAMP 
WHERE (nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%')
   OR ic = 'T0139046113'
   OR ic = '0139046113'
   OR ic LIKE 'T0139046113%'
   OR REPLACE(ic, '-', '') = '0139046113';

-- Step 2: Update all related tables
UPDATE teachers 
SET user_ic = '710515-06-5193' 
WHERE user_ic = 'T0139046113' 
   OR user_ic = '0139046113'
   OR user_ic LIKE 'T0139046113%'
   OR REPLACE(user_ic, '-', '') = '0139046113';

UPDATE classes 
SET guru_ic = '710515-06-5193' 
WHERE guru_ic = 'T0139046113' 
   OR guru_ic = '0139046113'
   OR guru_ic LIKE 'T0139046113%'
   OR REPLACE(guru_ic, '-', '') = '0139046113';

UPDATE user_roles 
SET user_ic = '710515-06-5193' 
WHERE user_ic = 'T0139046113' 
   OR user_ic = '0139046113'
   OR user_ic LIKE 'T0139046113%'
   OR REPLACE(user_ic, '-', '') = '0139046113';

UPDATE students 
SET user_ic = '710515-06-5193' 
WHERE user_ic = 'T0139046113' 
   OR user_ic = '0139046113'
   OR user_ic LIKE 'T0139046113%'
   OR REPLACE(user_ic, '-', '') = '0139046113';

UPDATE attendance 
SET student_ic = '710515-06-5193' 
WHERE student_ic = 'T0139046113' 
   OR student_ic = '0139046113'
   OR student_ic LIKE 'T0139046113%'
   OR REPLACE(student_ic, '-', '') = '0139046113';

UPDATE results 
SET student_ic = '710515-06-5193' 
WHERE student_ic = 'T0139046113' 
   OR student_ic = '0139046113'
   OR student_ic LIKE 'T0139046113%'
   OR REPLACE(student_ic, '-', '') = '0139046113';

UPDATE fees 
SET student_ic = '710515-06-5193' 
WHERE student_ic = 'T0139046113' 
   OR student_ic = '0139046113'
   OR student_ic LIKE 'T0139046113%'
   OR REPLACE(student_ic, '-', '') = '0139046113';

UPDATE payments 
SET student_ic = '710515-06-5193' 
WHERE student_ic = 'T0139046113' 
   OR student_ic = '0139046113'
   OR student_ic LIKE 'T0139046113%'
   OR REPLACE(student_ic, '-', '') = '0139046113';

COMMIT;

-- Verify
SELECT ic, nama, role FROM users WHERE ic = '710515-06-5193';
SELECT COUNT(*) as teachers_count FROM teachers WHERE user_ic = '710515-06-5193';
SELECT COUNT(*) as classes_count FROM classes WHERE guru_ic = '710515-06-5193';

