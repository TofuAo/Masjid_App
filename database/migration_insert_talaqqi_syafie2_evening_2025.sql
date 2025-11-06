USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM SYAFI'E (EVENING)
-- USTAZ MUHAMMAD SABRI BIN RAZALI
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0189678653', 'USTAZ MUHAMMAD SABRI BIN RAZALI', '0189678653', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0189678653', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (2IS)%' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM SYAFI''E (2IS)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0189678653',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_syafie2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (2IS)' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));

-- Find class with USTAZ MOHD SUKRI BIN CHE MAT (USTAZ SUKRI) for WAN ZAITUN transfer
SET @kelas_sukri_id = (SELECT id FROM classes WHERE guru_ic = (SELECT ic FROM users WHERE telefon = '0197278384' OR nama LIKE '%MOHD SUKRI%CHE MAT%' LIMIT 1) LIMIT 1);

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199313907', 'BAHARUDIN BIN AWANG ZAINUDIN', '0199313907', 'student', 'aktif'),
('S0195320972', 'JAMAT BIN RUSIDIN', '0195320972', 'student', 'aktif'),
('S0179036570', 'KHARUDDIN BIN ABD MALEK', '0179036570', 'student', 'aktif'),
('S0199153357', 'MOHD REDZUAN BIN MOHD SALLEH', '0199153357', 'student', 'aktif'),
('S0139656412', 'SARIFAH BINTI YAZID', '0139656412', 'student', 'aktif'),
('S0143187215', 'SHARIFAH ANAIZAH BINTI SYED ALI', '0143187215', 'student', 'aktif'),
('S0199895171', 'WAN ZAITUN BT WAN YAHYA', '0199895171', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the appropriate classes
-- Regular students (6 students) - link to evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199313907', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0195320972', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0179036570', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199153357', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139656412', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0143187215', @kelas_talaqqi_syafie2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

-- WAN ZAITUN BT WAN YAHYA - Transfer to Ustaz Sukri class if exists, otherwise keep in evening class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199895171', COALESCE(@kelas_sukri_id, @kelas_talaqqi_syafie2_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_sukri_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);

