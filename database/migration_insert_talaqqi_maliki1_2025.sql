USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 1 IMAM MALIKI
-- USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01111015704', 'USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF', '01111015704', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01111015704', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (1IM)%' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (1IM)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T01111015704',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_maliki1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (1IM)' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199808015', 'ASIAH BINTI ENDOT', '0199808015', 'student', 'aktif'),
('S0139522434', 'FATIMAH BINTI GANAL @ ZAINAL', '0139522434', 'student', 'aktif'),
('S0195554641', 'ISMA KHAIRUL BIN ISMAIL', '0195554641', 'student', 'aktif'),
('S0129479794', 'MEK ZAH@ZAIDAH BINTI JUSOH', '0129479794', 'student', 'aktif'),
('S0168249711', 'TUAN LAILY SURAYA BINTI TUAN LONG', '0168249711', 'student', 'aktif'),
('S0199566463', 'YUSRI BIN MOHD ALI', '0199566463', 'student', 'aktif'),
('S0193862911', 'MOHD HAMIJA BIN ABD RAZALI', '0193862911', 'student', 'aktif'),
('S0129286364', 'NORJIAH BINTI SUDIRAN', '0129286364', 'student', 'aktif'),
('S0132216725', 'ROHAYA BINTI ABD RAHMAN', '0132216725', 'student', 'aktif'),
('S0199326768', 'ZANARIAH BT RAMLI @ ZAINAL', '0199326768', 'student', 'aktif'),
('S0127805242', 'AZARIZA BINTI MUDA', '0127805242', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
-- Note: If ROHAYA BINTI ABD RAHMAN already exists in another class, this will update her class assignment
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199808015', @kelas_maliki1_id, '2025-02-06'),
('S0139522434', @kelas_maliki1_id, '2025-02-06'),
('S0195554641', @kelas_maliki1_id, '2025-02-06'),
('S0129479794', @kelas_maliki1_id, '2025-02-06'),
('S0168249711', @kelas_maliki1_id, '2025-02-06'),
('S0199566463', @kelas_maliki1_id, '2025-02-06'),
('S0193862911', @kelas_maliki1_id, '2025-02-06'),
('S0129286364', @kelas_maliki1_id, '2025-02-06'),
('S0132216725', @kelas_maliki1_id, '2025-02-06'),
('S0199326768', @kelas_maliki1_id, '2025-02-06'),
('S0127805242', @kelas_maliki1_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

