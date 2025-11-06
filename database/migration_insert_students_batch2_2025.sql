-- ==============================================
-- DATABASE MIGRATION: Insert Student Batch 2
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts student data into the existing masjid_app database
-- Note: Students need to be linked to appropriate class after insertion

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S01999278126', 'MOHD AZWAN BIN ABDULLAH', '019-99278126', 'student', 'aktif'),
('S0199928468', 'AZDALINA BINTI BAKAR', '019-9928468', 'student', 'aktif'),
('S0125027773', 'MASITAH BINTI TAHIR', '012-5027773', 'student', 'aktif'),
('S0196125377', 'MD ZAIDEY BIN ABD KADIR', '019-6125377', 'student', 'aktif'),
('S0123130312', 'ADI FAZULI BIN MAMAT', '012-3130312', 'student', 'aktif'),
('S0178148442', 'WAN SAHIZAN WAN ISAMAIL', '017-8148442', 'student', 'aktif'),
('S0169898008', 'MOHD NIZAM BIN MOHD ISA', '016-9898008', 'student', 'aktif'),
('S0142947672', 'MOHAMAD FAKHRUL ADHAM BIN WAHID', '014-2947672', 'student', 'aktif'),
('S01128940369', 'NUR SHARMILA BT SABRI', '011-28940369', 'student', 'aktif'),
('S0169890009', 'RAHAYU BT JUSOH EMBONG', '016-9890009', 'student', 'aktif'),
('S0129853151', 'FAUZIAH BINTI DAUD', '012-9853151', 'student', 'aktif'),
('S0179744113', 'MOHD KHAIRUL IDWAN BIN MOHD ABIDIN', '017-9744113', 'student', 'aktif'),
('S01393204661', 'SYED MOHD SOHAIMI BIN SYED NORDIN', '013-93204661', 'student', 'aktif'),
('S0179732709', 'NORMAH BINTI ABDUL MALEK', '017-9732709', 'student', 'aktif'),
('S0139336162', 'NORLELAWATI BINTI ABDUL MANAF', '013-9336162', 'student', 'aktif'),
('S0132629753', 'NORSUHAILA BINTI MOHD GHAZALI', '013-2629753', 'student', 'aktif'),
('S01119474459', 'FAKHRUL ASYRAF BIN ABDULLAH', '011-19474459', 'student', 'aktif'),
('S0179881676', 'MUHAMMAD ILYAS HANIF BIN SHAMSUDDIN', '017-9881676', 'student', 'aktif'),
('S0189020187', 'NORMI FATHUL SHUHADA BINTI ABI RAHMAN', '018-9020187', 'student', 'aktif'),
('S01137587089', 'MOHAMMAD HASIF BIN AB RAHMAN', '011-37587089', 'student', 'aktif'),
('S0199883655', 'DZAWANI BT MUHAMAD', '019-9883655', 'student', 'aktif'),
('S0148448959', 'MD AZUANDY BIN MD ARIFFIN', '014-8448959', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASS
-- ====================================================
-- NOTE: Replace [CLASS_ID] with the actual class ID for the main group
-- Or use class matching criteria below

-- Main group (20 students - excluding DZAWANI and MD AZUANDY)
-- INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
-- SELECT u.ic, [CLASS_ID], CURDATE()
-- FROM users u
-- WHERE u.ic IN (
--     'S01999278126', 'S0199928468', 'S0125027773', 'S0196125377', 'S0123130312',
--     'S0178148442', 'S0169898008', 'S0142947672', 'S01128940369', 'S0169890009',
--     'S0129853151', 'S0179744113', 'S01393204661', 'S0179732709', 'S0139336162',
--     'S0132629753', 'S01119474459', 'S0179881676', 'S0189020187', 'S01137587089'
-- )
-- ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- STEP 3: HANDLE SPECIAL CASES
-- ====================================================

-- DZAWANI BT MUHAMAD - TUKAR WAKTU KELAS (USTAZ IZMAN)
-- Link to USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM (T0103949789)
-- INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
-- SELECT u.ic, c.id, CURDATE()
-- FROM users u
-- CROSS JOIN (
--     SELECT id FROM classes 
--     WHERE guru_ic = 'T0103949789' 
--     LIMIT 1
-- ) c
-- WHERE u.ic = 'S0199883655'
-- ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- MD AZUANDY BIN MD ARIFFIN - PINDAH PERINGKAT TAHSIN ASAS (US ZULKIFLI)
-- Link to USTAZ ZULKIFLI BIN YAAKUB (T0129516044) - TAHSIN ASAS
-- INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
-- SELECT u.ic, c.id, CURDATE()
-- FROM users u
-- CROSS JOIN (
--     SELECT id FROM classes 
--     WHERE guru_ic = 'T0129516044' 
--     AND level = 'TAHSIN ASAS'
--     LIMIT 1
-- ) c
-- WHERE u.ic = 'S0148448959'
-- ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone, spaces removed)
-- 2. Two students have special notes:
--    - DZAWANI BT MUHAMAD: Needs to change class time (USTAZ IZMAN)
--    - MD AZUANDY BIN MD ARIFFIN: Transfer to TAHSIN ASAS (US ZULKIFLI)
-- 3. Main group (20 students) need to be linked to appropriate class
-- 4. Special cases are handled separately above (commented out until class is determined)
-- ====================================================

