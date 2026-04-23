USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 1 IMAM MALIKI (AFTERNOON)
-- USTAZ MOHD HASNUL MINZAR BIN ISMAIL
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0139222728', 'USTAZ MOHD HASNUL MINZAR BIN ISMAIL', '0139222728', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139222728', JSON_ARRAY('TALAQQI', 'IMAM MALIKI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (1IM)%' AND guru_ic = 'T0139222728' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (1IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139222728',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_maliki1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (1IM)' AND guru_ic = 'T0139222728' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0129889592', 'CHE ROHAYU BT CHE YUSOFF', '0129889592', 'student', 'aktif'),
('S0139878327', 'HJH NOR ZIHAN BT HJ HARUN', '0139878327', 'student', 'aktif'),
('S0197140472', 'KAMARUL BAHYAH BINTI MUSTAFA', '0197140472', 'student', 'aktif'),
('S0199313410', 'NOORLEYDA BINTI AHMAD', '0199313410', 'student', 'aktif'),
('S0182970020', 'SITI ZURINA BINTI ZAHARI', '0182970020', 'student', 'aktif'),
('S0133336610', 'TUTY MARDYNA BINTI HARUN', '0133336610', 'student', 'aktif'),
('S0199231029', 'HAJAH HALIMAH BINTI HAJI ALI', '0199231029', 'student', 'aktif'),
('S0146058455', 'ZAINUM BINTI MOHD', '0146058455', 'student', 'aktif'),
('S0199932947', 'AMINAH BINTI MAHMOOD', '0199932947', 'student', 'aktif'),
('S0142915609', 'NORHAYATI BT ABU BAKAR', '0142915609', 'student', 'aktif'),
('S0199886969', 'NOOR LILI BINTI MOHD AMIN', '0199886969', 'student', 'aktif'),
('S0139940025', 'HJ. ALAM SHAH BIN HJ. SALLEH', '0139940025', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class (will transfer existing students from their previous classes)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129889592', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0139878327', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0197140472', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199313410', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0182970020', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0133336610', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199231029', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0146058455', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199932947', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0142915609', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199886969', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0139940025', @kelas_talaqqi_maliki1_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

