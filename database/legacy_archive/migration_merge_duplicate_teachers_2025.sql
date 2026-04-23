-- ==============================================
-- DATABASE MIGRATION: Merge Duplicate Teachers
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script transfers class assignments from old teachers to new teachers
-- and removes the old duplicate teachers

-- ====================================================
-- STEP 1: TRANSFER CLASS ASSIGNMENTS
-- ====================================================
-- Update classes to use new teacher ICs instead of old ones

-- A. ZUNNOR BIN ABD RAHMAN
-- Old: 710515-06-5193 (2 classes) -> New: 7105150605193
UPDATE classes SET guru_ic = '7105150605193' WHERE guru_ic = '710515-06-5193';

-- AHMAD HAYATUL FAIZ BIN ABD LATIF
-- Old: T01111015704 (6 classes) -> New: 9311290605047
UPDATE classes SET guru_ic = '9311290605047' WHERE guru_ic = 'T01111015704';

-- AMIR HASIF BIN HATA
-- Old: T0199165897 (4 classes) -> New: 9203120605113
UPDATE classes SET guru_ic = '9203120605113' WHERE guru_ic = 'T0199165897';

-- MOHD NOOR BIN DIN
-- Old: T0199706272 (4 classes) -> New: 7011080605175
UPDATE classes SET guru_ic = '7011080605175' WHERE guru_ic = 'T0199706272';

-- MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ
-- Old: T0139424413 (2 classes) -> New: 9512200605759
UPDATE classes SET guru_ic = '9512200605759' WHERE guru_ic = 'T0139424413';

-- MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI
-- Old: T01121621582 (2 classes) -> New: 9901240605179
UPDATE classes SET guru_ic = '9901240605179' WHERE guru_ic = 'T01121621582';

-- MUHAMMAD HAFIZUDDIN BIN TAJUDDIN
-- Old: T0199684539 (2 classes) -> New: 9605050605909
UPDATE classes SET guru_ic = '9605050605909' WHERE guru_ic = 'T0199684539';

-- MUHAMMAD IHSAN BIN MHD ZAHARI
-- Old: T0162457106 (2 classes) -> New: 9112100605097
UPDATE classes SET guru_ic = '9112100605097' WHERE guru_ic = 'T0162457106';

-- SHAIFUDDIN BIN NGAH
-- Old: T0199390972 (4 classes) -> New: 7203230605059
UPDATE classes SET guru_ic = '7203230605059' WHERE guru_ic = 'T0199390972';

-- ====================================================
-- STEP 2: DELETE OLD DUPLICATE TEACHERS
-- ====================================================
-- Note: ON DELETE CASCADE will automatically delete from teachers table

DELETE FROM users WHERE ic = '710515-06-5193' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T01111015704' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199165897' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199706272' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0139424413' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T01121621582' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199684539' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0162457106' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199390972' AND role = 'teacher';

-- ====================================================
-- VERIFICATION: Check merged teachers and their classes
-- ====================================================
SELECT 
    u.ic,
    u.nama,
    u.telefon,
    u.status,
    COUNT(c.id) as total_classes,
    GROUP_CONCAT(c.nama_kelas SEPARATOR ', ') as classes
FROM users u
LEFT JOIN classes c ON u.ic = c.guru_ic
WHERE u.ic IN (
    '7105150605193', '9311290605047', '9203120605113', '7011080605175',
    '9512200605759', '9901240605179', '9605050605909', '9112100605097',
    '7203230605059'
)
GROUP BY u.ic, u.nama, u.telefon, u.status
ORDER BY u.nama;

