USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM MALIKI (EVENING)
-- USTAZ NASHARUDDIN BIN NGAH
-- Schedule: SELASA & KHAMIS (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139326688', 'USTAZ NASHARUDDIN BIN NGAH', '0139326688', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139326688', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T0139326688' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (9.00 malam - 10.30 malam)',
    150.00,
    'T0139326688',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_maliki2_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T0139326688' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0139831096', 'ZAINUNDIN AHMAD', '0139831096', 'student', 'aktif'),
('S0139220805', 'HJ. BRAHIM BIN HJ. ULIS', '0139220805', 'student', 'aktif'),
('S0199162251', 'MOHD NADHIR BIN MAT SALLEH@ AB.HAMID', '0199162251', 'student', 'aktif'),
('S0129212640', 'ZAHARIDAH BINTI MANSOR', '0129212640', 'student', 'aktif'),
('S0139383483', 'JAMAL NASSER BIN SALLEH', '0139383483', 'student', 'aktif'),
('S0199911656', 'RUSMANI BINTI YUNUS', '0199911656', 'student', 'aktif'),
('S0193300147', 'ABU BIN SYAFIE', '0193300147', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class (RUSMANI will be transferred from previous class)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139831096', @kelas_maliki2_evening_id, '2025-02-06'),
('S0139220805', @kelas_maliki2_evening_id, '2025-02-06'),
('S0199162251', @kelas_maliki2_evening_id, '2025-02-06'),
('S0129212640', @kelas_maliki2_evening_id, '2025-02-06'),
('S0139383483', @kelas_maliki2_evening_id, '2025-02-06'),
('S0199911656', @kelas_maliki2_evening_id, '2025-02-06'),
('S0193300147', @kelas_maliki2_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

