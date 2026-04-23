USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 4 IMAM HAMBALI (EVENING)
-- USTAZ MOHD HASNUL MINZAR BIN ISMAIL
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139222728', 'USTAZ MOHD HASNUL MINZAR BIN ISMAIL', '0139222728', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139222728', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (4IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0139222728',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali4_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (4IHb)' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));

-- Find afternoon class for HJ. ALAM SHAH (if exists)
SET @kelas_hambali4_afternoon_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Find class with USTAZ AHMAD HAYATUL FAIZ (USTAZ FAIZ) for ZANARIAH
SET @kelas_faiz_id = (SELECT id FROM classes WHERE guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199999383', 'ASRI BIN GHAZALI', '0199999383', 'student', 'aktif'),
('S0199132829', 'NAZIAH KAMUN', '0199132829', 'student', 'aktif'),
('S0199886969', 'NOOR LILI BINTI MOHD AMIN', '0199886969', 'student', 'aktif'),
('S0179525550', 'ROHAYA BINTI ADIN', '0179525550', 'student', 'aktif'),
('S0169225046', 'SURIA BINTI AHMAD', '0169225046', 'student', 'aktif'),
('S0199891900', 'IBRAHIM BIN ABDUL MALEK', '0199891900', 'student', 'aktif'),
('S0199895576', 'RODHUAN BIN AHMAD', '0199895576', 'student', 'aktif'),
('S0139598575', 'NUR HAZIQAH BINTI RAZALI', '0139598575', 'student', 'aktif'),
('S0139940025', 'HJ. ALAM SHAH BIN HJ. SALLEH', '0139940025', 'student', 'aktif'),
('S0199326768', 'ZANARIAH BINTI RAMLI @ KADIR', '0199326768', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the appropriate classes based on catatan (notes)
-- Regular students (8 students) - link to evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199999383', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199132829', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199886969', @kelas_hambali4_evening_id, '2025-02-06'),
('S0179525550', @kelas_hambali4_evening_id, '2025-02-06'),
('S0169225046', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199891900', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199895576', @kelas_hambali4_evening_id, '2025-02-06'),
('S0139598575', @kelas_hambali4_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

-- HJ. ALAM SHAH - Transfer to afternoon class if exists, otherwise keep in evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139940025', COALESCE(@kelas_hambali4_afternoon_id, @kelas_hambali4_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_hambali4_afternoon_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

-- ZANARIAH - Transfer to Ustaz Faiz class if exists, otherwise keep in evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199326768', COALESCE(@kelas_faiz_id, @kelas_hambali4_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_faiz_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

