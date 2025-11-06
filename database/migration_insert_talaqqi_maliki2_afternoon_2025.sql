USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM MALIKI (AFTERNOON)
-- USTAZ A.ZUNNOR BIN ABD RAHMAN
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139046113', 'USTAZ A.ZUNNOR BIN ABD RAHMAN', '0139046113', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139046113', JSON_ARRAY('TALAQQI', 'IMAM MALIKI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T0139046113' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139046113',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_maliki2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T0139046113' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Find class with USTAZ SULAIMAN BIN NORDIN for NOR'AINI transfer
SET @kelas_sulaiman_id = (SELECT id FROM classes WHERE guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Create student users (handle PUTERI ZULAIQHA with no phone number)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0102221509', 'SHAHRIDAN BINTI AIZAD', '0102221509', 'student', 'aktif'),
('S0139077773', 'FATIMAH BINTI HASHIM', '0139077773', 'student', 'aktif'),
('S0196485880', 'MAH BT EMBONG', '0196485880', 'student', 'aktif'),
('S0199852475', 'ALIMSIAH BINTI AW ENDUT', '0199852475', 'student', 'aktif'),
('S0149913394', 'CHE KU ROSNI BT CHE KU MAN', '0149913394', 'student', 'aktif'),
('S0199805429', 'RUZIMAH BINTI HAMID', '0199805429', 'student', 'aktif'),
('S0123923038', 'MAT DESA BIN NANYAN', '0123923038', 'student', 'aktif'),
('S0139351162', 'FARIDAH BINTI ALIAS', '0139351162', 'student', 'aktif'),
('S0199799183', 'KHAMSAH BINTI MAHMUD', '0199799183', 'student', 'aktif'),
('SPUTERIZULAIQHA001', 'PUTERI ZULAIQHA', NULL, 'student', 'aktif'),
('S0129839089', 'NOR''AINI BINTI MHD BASARI', '0129839089', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the appropriate classes
-- Regular students (10 students) - link to maliki2 class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0102221509', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0139077773', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0196485880', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199852475', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0149913394', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199805429', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0123923038', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0139351162', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199799183', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('SPUTERIZULAIQHA001', @kelas_talaqqi_maliki2_id, '2025-02-07')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

-- NOR'AINI BINTI MHD BASARI - Transfer to Ustaz Sulaiman class if exists, otherwise keep in maliki2 class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129839089', COALESCE(@kelas_sulaiman_id, @kelas_talaqqi_maliki2_id), '2025-02-07')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_sulaiman_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

