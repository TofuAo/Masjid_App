USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 4 IMAM SYAFI'E
-- USTAZ MOHD FADZLI BIN OTHMAN
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0129457975', 'USTAZ MOHD FADZLI BIN OTHMAN', '0129457975', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0129457975', JSON_ARRAY('TALAQQI', 'IMAM SYAFI\'E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status) VALUES
(
    'TALAQQI - IMAM SYAFI\'E (4IS)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0129457975',
    20,
    'aktif'
)
ON DUPLICATE KEY UPDATE 
    level=VALUES(level),
    sessions=VALUES(sessions),
    jadual=VALUES(jadual),
    yuran=VALUES(yuran),
    guru_ic=VALUES(guru_ic),
    kapasiti=VALUES(kapasiti),
    status=VALUES(status);

-- Get the class ID
SET @kelas_syafie_id = (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI\'E (4IS)' AND guru_ic = 'T0129457975' LIMIT 1);

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199897719', 'MAHAROM BINTI OSMAN', '0199897719', 'student', 'aktif'),
('S0139105798', 'ASIAH BINTI MOHD', '0139105798', 'student', 'aktif'),
('S0179637770', 'ASIAH BINTI SULAIMAN', '0179637770', 'student', 'aktif'),
('S0139832558', 'HAFIDA BINTI MOHD ZAIN', '0139832558', 'student', 'aktif'),
('S0182468337', 'SARINAH BINTI ABDULLAH', '0182468337', 'student', 'aktif'),
('S01139894904', 'FARIDAH BIN MANSOR', '01139894904', 'student', 'aktif'),
('S0129605388', 'KHAMSIAH BT ABD AZIZ', '0129605388', 'student', 'aktif'),
('S01127181594', 'SHRIPAH RAHANI BINTI SYED DRAHIM', '01127181594', 'student', 'aktif'),
('S0176675855', 'AZMIAH BINTI MAKHTAR', '0176675855', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199897719', @kelas_syafie_id, '2025-02-06'),
('S0139105798', @kelas_syafie_id, '2025-02-06'),
('S0179637770', @kelas_syafie_id, '2025-02-06'),
('S0139832558', @kelas_syafie_id, '2025-02-06'),
('S0182468337', @kelas_syafie_id, '2025-02-06'),
('S01139894904', @kelas_syafie_id, '2025-02-06'),
('S0129605388', @kelas_syafie_id, '2025-02-06'),
('S01127181594', @kelas_syafie_id, '2025-02-06'),
('S0176675855', @kelas_syafie_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

