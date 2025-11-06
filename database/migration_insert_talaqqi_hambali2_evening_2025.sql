USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HAMBALI (EVENING)
-- USTAZ AHMAD REDZUAN BIN AMAT
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139043035', 'USTAZ AHMAD REDZUAN BIN AMAT', '0139043035', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139043035', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0139043035' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0139043035',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_hambali2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0139043035' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));

-- Find class with USTAZ AHMAD HAYATUL FAIZ (USTAZ FAIZ) for AZARIZA transfer
SET @kelas_faiz_id = (SELECT id FROM classes WHERE guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0129604919', 'MOHD FAZIRULLAH BIN ABDUL MAJID', '0129604919', 'student', 'aktif'),
('S0199823311', 'KHATIJAH BINTI DIN', '0199823311', 'student', 'aktif'),
('S0199908315', 'FARIDAH BINTI ALI', '0199908315', 'student', 'aktif'),
('S01111194233', 'HAFIZA BINTI MOHD ROOM', '01111194233', 'student', 'aktif'),
('S0139275033', 'LATIFAH BINTI OTHMAN', '0139275033', 'student', 'aktif'),
('S0178500503', 'FARHANAH BINTI OTHMAN', '0178500503', 'student', 'aktif'),
('S0127805242', 'AZARIZA BINTI MUDA', '0127805242', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the appropriate classes
-- Regular students (6 students) - link to evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129604919', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0199823311', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0199908315', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S01111194233', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0139275033', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0178500503', @kelas_talaqqi_hambali2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

-- AZARIZA BINTI MUDA - Transfer to Ustaz Faiz class if exists, otherwise keep in evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0127805242', COALESCE(@kelas_faiz_id, @kelas_talaqqi_hambali2_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_faiz_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

