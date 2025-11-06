-- ==============================================
-- DATABASE MIGRATION: Insert Student Batch
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts student data into the existing masjid_app database
-- Note: Students need to be linked to appropriate class after insertion

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0124664455', 'ROHANAH BINTI ATAN', '012-4664455', 'student', 'aktif'),
('S0139819437', 'SITI HAFIZAH BINTI AMJAD ALI', '013-9819437', 'student', 'aktif'),
('S0132407202', 'NORMALA BINTI NGAH', '013-2407202', 'student', 'aktif'),
('S01160902509', 'MUHAMMAD ZAMRI BIN MANSOR', '011-60902509', 'student', 'aktif'),
('S0139219059', 'ROSLELAWATI BINTI ARHAM', '013-9219059', 'student', 'aktif'),
('S0139346402', 'ZAKARIA BIN MUHAMMAD', '013-9346402', 'student', 'aktif'),
('S0192575907', 'MOHAMAD HAZIQ BIN ABU OTHMAN', '019-2575907', 'student', 'aktif'),
('S0195462234', 'NURULHUDA BINTI MOHD JOHARI', '019-5462234', 'student', 'aktif'),
('S0123712446', 'HAJJAH FADZILAH BINTI HJ OMAR', '012-3712446', 'student', 'aktif'),
('S0199330260', 'WAN ADNAN BIN WAN SHAFIE', '019-9330260', 'student', 'aktif'),
('S0139184575', 'SHAHRIL AZLIN BIN MOHTAR', '013-9184575', 'student', 'aktif'),
('S0189076844', 'NUR AFIFAH BINTI HAZLAN', '018-9076844', 'student', 'aktif'),
('S0199639857', 'NOR HALIZA BINTI MD AMIN', '019-9639857', 'student', 'aktif'),
('S0199285947', 'CHE IZANI BIN CHE HASSAN', '019-9285947', 'student', 'aktif'),
('S0129486132', 'WAN ANIZAR BINTI WAN MALEK', '012-9486132', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone, spaces removed)
-- 2. HAJJAH FADZILAH BINTI HJ OMAR appears twice in source (rows 9 and 12)
--    - Only one entry created (duplicate by phone number will be handled by ON DUPLICATE KEY)
-- 3. Students need to be linked to appropriate class using:
--    INSERT INTO students (user_ic, kelas_id, tarikh_daftar) SELECT ...
-- 4. To link students, specify the class_id or use class matching criteria
-- ====================================================

