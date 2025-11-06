USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HAMBALI (EVENING)
-- USTAZ FARIDNUDDIN BIN MUHAMAD
-- Schedule: SELASA & KHAMIS (9.00 malam - 10.30 malam)
-- Note: This is different from the afternoon class (2 IMAM SYAFI'E)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0148391236', 'USTAZ FARIDNUDDIN BIN MUHAMAD', '0148391236', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0148391236', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (9.00 malam - 10.30 malam)',
    150.00,
    'T0148391236',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali2_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));

-- Find class with USTAZ MUHAMMAD IKHRAM BIN ZAINAL for KHAFSAH transfer
SET @kelas_ikhram_id = (SELECT id FROM classes WHERE guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0166897199', 'MOHD BASIUNI BIN YAACOB', '0166897199', 'student', 'aktif'),
('S0139708365', 'AIZA ASMAD BIN IBRAHIM', '0139708365', 'student', 'aktif'),
('S0104428762', 'KAMARIAH BINTI ISMAIL', '0104428762', 'student', 'aktif'),
('S0109887106', 'FAUZIAH BINTI ALI', '0109887106', 'student', 'aktif'),
('S0108462115', 'NOOR FUDZIAN BT ABU BAKAR', '0108462115', 'student', 'aktif'),
('S0145107267', 'AKMAL AISHAH BINTI RAHIMI', '0145107267', 'student', 'aktif'),
('S0199887956', 'KHAFSAH BINTI MOHD SHAIEN', '0199887956', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the appropriate classes
-- Regular students (6 students) - link to evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0166897199', @kelas_hambali2_evening_id, '2025-02-06'),
('S0139708365', @kelas_hambali2_evening_id, '2025-02-06'),
('S0104428762', @kelas_hambali2_evening_id, '2025-02-06'),
('S0109887106', @kelas_hambali2_evening_id, '2025-02-06'),
('S0108462115', @kelas_hambali2_evening_id, '2025-02-06'),
('S0145107267', @kelas_hambali2_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

-- KHAFSAH BINTI MOHD SHAIEN - Transfer to Ustaz Ikhram class if exists, otherwise keep in evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199887956', COALESCE(@kelas_ikhram_id, @kelas_hambali2_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_ikhram_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

