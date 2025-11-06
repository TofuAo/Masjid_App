-- ==============================================
-- DATABASE MIGRATION: Insert ASAS Level Students for Kelas Pengajian 2025
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- PERINGKAT ASAS - USTAZ MOHAMMAD WAZAR BIN MOHD DAWI
-- ==============================================
-- This script inserts ASAS level student data into the existing masjid_app database
-- Class: 4 IMAM HANAFI
-- Schedule: ISNIN & RABU (5.00 petang - 6.30 petang)

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

-- ASAS - 4 IMAM HANAFI - USTAZ MOHAMMAD WAZAR BIN MOHD DAWI
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0179525622', 'HURDY BIN HASHIM', '017-9525622', 'student', 'aktif'),
('S0137706137', 'ROSINAWATI BINTI SENANG', '013-7706137', 'student', 'aktif'),
('S0139822728', 'MOHD FARIK BIN ABDUL RAFFAR', '013-9822728', 'student', 'aktif'),
('S01125502915', 'MUHAMMAD FAIZ BIN ISMAIL', '011-25502915', 'student', 'aktif'),
('S0195415705', 'NURUL ADILAH BINTI HAMZAH', '019-5415705', 'student', 'aktif'),
('S01128664748', 'ATIKAH BINTI ABU BAKAR', '011-28664748', 'student', 'aktif'),
('S0199171636', 'HAMISAH BINTI MD YASSIM', '019-9171636', 'student', 'aktif'),
('S0139960295', 'JUHAR BIN IDRUS', '013-9960295', 'student', 'aktif'),
('S0142891085', 'NUR KAMARIAHAZIM BINTI ABDUL MUTTALIB', '014-2891085', 'student', 'aktif'),
('S01110216556', 'RAHAYU @ NORASHIKIN BINTI KADRI', '011-10216556', 'student', 'aktif'),
('S0133917707', 'NORAINI BINTI A MOHAMED', '013-3917707', 'student', 'aktif'),
('S0139386060', 'NORELA BINTI AHMAD', '013-9386060', 'student', 'aktif'),
('S0177078384', 'SITI SURIA BINTI HJ SHEIKH SALIM', '017-7078384', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASS
-- ====================================================

-- ASAS - 4 IMAM HANAFI - USTAZ MOHAMMAD WAZAR BIN MOHD DAWI (T0139000168)
-- Schedule: ISNIN & RABU (5.00 petang - 6.30 petang)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-05' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0139000168' 
    AND nama_kelas LIKE '%IMAM HANAFI%'
    AND level = 'ASAS'
    AND jadual LIKE '%ISNIN%RABU%'
    AND jadual LIKE '%5.00%petang%'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0179525622', 'S0137706137', 'S0139822728', 'S01125502915', 'S0195415705',
    'S01128664748', 'S0199171636', 'S0139960295', 'S0142891085', 'S01110216556',
    'S0133917707', 'S0139386060', 'S0177078384'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone)
-- 2. If students already exist, they will be updated (ON DUPLICATE KEY UPDATE)
-- 3. Students are linked to the ASAS - 4 IMAM HANAFI class
-- 4. Registration date is set to 2025-02-05 (matching source data)
-- 5. Note: SITI SURIA BINTI HJ SHEIKH SALIM (S0177078384) may already exist 
--    from TAHSIN ASAS class - will be updated to ASAS class
-- ====================================================

