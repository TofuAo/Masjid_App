-- ==============================================
-- DATABASE MIGRATION: Insert ASAS Level Students (USTAZ MUHAMMAD IHSAN)
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- PERINGKAT ASAS - USTAZ MUHAMMAD IHSAN BIN MHD ZAHARI
-- ==============================================
-- This script inserts ASAS level student data into the existing masjid_app database
-- Class: 4 IMAM MALIKI (based on previous migration, this teacher teaches at 4IM)
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

-- ASAS - 4 IMAM MALIKI - USTAZ MUHAMMAD IHSAN BIN MHD ZAHARI
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S01126189920', 'SALLY SUWANI BINTI HASSAN', '011-26189920', 'student', 'aktif'),
('S0199451933', 'NUR BAITI BINTI SAMSUDDIN', '019-9451933', 'student', 'aktif'),
('S0169212178', 'AHMAD BIN ABDUL LATIFF', '016-9212178', 'student', 'aktif'),
('S0106592769', 'ENCIK SYARIZA JUSRI BIN ZULKIPLI', '010-6592769', 'student', 'aktif'),
('S0179730715', 'MUHD SYAH AMYZUL HAFIQ BIN FAUZIH', '017-9730715', 'student', 'aktif'),
('S0139601041', 'MOHD RIZAL BIN ISMAIL', '013-9601041', 'student', 'aktif'),
('S0139229103', 'ZAWAWI BIN YUSOP', '013-9229103', 'student', 'aktif'),
('S0199696462', 'MOHAMED ZAMRI BIN ABAS', '019-9696462', 'student', 'aktif'),
('S0125554964', 'NOR AZIRA BINTI ALIAS', '012-5554964', 'student', 'aktif'),
('S0199273210', 'MOHD AZHAR BIN ISMAIL', '019-9273210', 'student', 'aktif'),
('S0145251803', 'MUHAMMAD NUR SHAFIQ BIN MOHD HASHIM', '014-5251803', 'student', 'aktif'),
('S0162512368', 'NOOR AISHAH BINTI ALI', '016-2512368', 'student', 'aktif'),
('S0178338766', 'NABILA NAJWA BINTI MOHAMED ROSLY', '017-8338766', 'student', 'aktif'),
('S0126120781', 'FAIRO ANIZAN BIN IBRAHIM', '012-6120781', 'student', 'aktif'),
('S0106572176', 'MUHAMMAD HAJRUL ASWAD BIN AB RAHMAN', '010-6572176', 'student', 'aktif'),
('S0199448666', 'NORLIA BINTI ABDUL MANAF', '019-9448666', 'student', 'aktif'),
('S0139729556', 'HAJIRAHANIS BINTI MOHD SALLEH', '013-9729556', 'student', 'aktif'),
('S0123916645', 'SHARIZA BINTI MAT ARIS', '012-3916645', 'student', 'aktif'),
('S01133437529', 'NUR SYAKINAH SYAMIL BINTI SHAHRUL NIZAM', '011-33437529', 'student', 'aktif'),
('S0145472508', 'ABDUR RAHMAN BIN KAMARUZAMAN', '014-5472508', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASS
-- ====================================================

-- ASAS - 4 IMAM MALIKI - USTAZ MUHAMMAD IHSAN BIN MHD ZAHARI (T0162457106)
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- Note: This teacher teaches at 4IM (IMAM MALIKI) based on previous migration
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-03' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0162457106' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'ASAS'
    AND jadual LIKE '%ISNIN%RABU%'
    AND jadual LIKE '%9.00%malam%'
    LIMIT 1
) c
WHERE u.ic IN (
    'S01126189920', 'S0199451933', 'S0169212178', 'S0106592769', 'S0179730715',
    'S0139601041', 'S0139229103', 'S0199696462', 'S0125554964', 'S0199273210',
    'S0145251803', 'S0162512368', 'S0178338766', 'S0126120781', 'S0106572176',
    'S0199448666', 'S0139729556', 'S0123916645', 'S01133437529', 'S0145472508'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- STEP 3: HANDLE STUDENT TRANSFER (based on catatan)
-- ====================================================

-- ABDUR RAHMAN BIN KAMARUZAMAN - Transfer to PERTENGAHAN (US NIZAM - T0129571959)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0129571959' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'PERTENGAHAN'
    LIMIT 1
)
WHERE u.ic = 'S0145472508'
AND u.nama LIKE '%ABDUR RAHMAN%';

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone)
-- 2. If students already exist, they will be updated (ON DUPLICATE KEY UPDATE)
-- 3. Students are linked to the ASAS - 4 IMAM MALIKI class
-- 4. Registration date is set to 2025-02-03 (matching source data)
-- 5. ABDUR RAHMAN is transferred to PERTENGAHAN level per catatan
-- ====================================================

