USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 1 IMAM HANAFI (AFTERNOON)
-- USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01115996053', 'USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN', '01115996053', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01115996053', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (1IH)%' AND guru_ic = 'T01115996053' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (1IH)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01115996053',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_hanafi1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (1IH)' AND guru_ic = 'T01115996053' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0179776901', 'ROZIHAN BT HASSAN', '0179776901', 'student', 'aktif'),
('S0199659648', 'SABARIAH BINTI HASAN', '0199659648', 'student', 'aktif'),
('S0199500823', 'DATO MIMI BT HJ ABDUL MALIK', '0199500823', 'student', 'aktif'),
('S0129634275', 'DATIN MUZAH BINTI ABU BAKAR', '0129634275', 'student', 'aktif'),
('S0129627601', 'ZAINAB BT ZAKARIA', '0129627601', 'student', 'aktif'),
('S0148166456', 'CHE KU ROSNI BT CHE KU MAN', '0148166456', 'student', 'aktif'),
('S0199718010', 'ROSMAINI BINTI ABDUL GHANI', '0199718010', 'student', 'aktif'),
('S0139239197', 'NAEMAH BINTI HJI ALI', '0139239197', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0179776901', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199659648', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199500823', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0129634275', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0129627601', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0148166456', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199718010', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0139239197', @kelas_talaqqi_hanafi1_id, '2025-02-12')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

