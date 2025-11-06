USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 3 IMAM HAMBALI (AFTERNOON)
-- USTAZ SULAIMAN BIN NORDIN
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139095315', 'USTAZ SULAIMAN BIN NORDIN', '0139095315', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139095315', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139095315',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_hambali3_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0129661672', 'ABDUL HADI BIN HAMID', '0129661672', 'student', 'aktif'),
('S0172227206', 'FATIMAH MARDHIYAH BINTI IZRAM', '0172227206', 'student', 'aktif'),
('S0102020512', 'HASNAH BINTI ARSHAD', '0102020512', 'student', 'aktif'),
('S0179276040', 'NORRIYATI BINTI MOHD ZIN', '0179276040', 'student', 'aktif'),
('S0126849090', 'RAFIDAH BINTI ABDUL RAHMAN', '0126849090', 'student', 'aktif'),
('S0139208138', 'ROHAYATI BT HANAFI', '0139208138', 'student', 'aktif'),
('S0199247659', 'SAMSUDIN BIN MOHD YATIM', '0199247659', 'student', 'aktif'),
('S0139327285', 'ZALILAH BT SAPUAN', '0139327285', 'student', 'aktif'),
('S0113514615', 'HAZMI BIN MUSTAFA', '0113514615', 'student', 'aktif'),
('S0129839089', 'NOR''AINI BINTI MHD BASARI', '0129839089', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129661672', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0172227206', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0102020512', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0179276040', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0126849090', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0139208138', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0199247659', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0139327285', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0113514615', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0129839089', @kelas_talaqqi_hambali3_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

