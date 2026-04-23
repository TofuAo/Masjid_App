USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM MALIKI
-- USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01111015704', 'USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF', '01111015704', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01111015704', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name and teacher)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T01111015704',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_maliki_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));

-- Create student users (handle phone numbers with multiple values)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199789853', 'ASMAH BINTI AHMAD', '0199789853', 'student', 'aktif'),
('S0139271964', 'FATIMAH BINTI ABU SAMAH', '0139271964', 'student', 'aktif'),
('S0199819606', 'HJH ROHANA BT HJ ABD RANI', '0199819606', 'student', 'aktif'),
('S0199592850', 'NOOR HAYATI BT DZAKARIA', '0199592850', 'student', 'aktif'),
('S0199866000', 'NORHAYATI BINTI ABDULLAH', '0199866000', 'student', 'aktif'),
('S01159095821', 'ROSNAH BINTI AHMAD', '01159095821', 'student', 'aktif'),
('S0133356836', 'ZAIMAH BINTI DAPAT', '0133356836', 'student', 'aktif'),
('S0136464525', 'FARAH ADIBAH BINTI ALAM SHAH', '0136464525', 'student', 'aktif'),
('S0197744764', 'AZIZAH BT DAUD', '0197744764', 'student', 'aktif'),
('S0132216725', 'ROHAYA BINTI ABD RAHMAN', '0132216725', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199789853', @kelas_maliki_id, '2025-02-06'),
('S0139271964', @kelas_maliki_id, '2025-02-06'),
('S0199819606', @kelas_maliki_id, '2025-02-06'),
('S0199592850', @kelas_maliki_id, '2025-02-06'),
('S0199866000', @kelas_maliki_id, '2025-02-06'),
('S01159095821', @kelas_maliki_id, '2025-02-06'),
('S0133356836', @kelas_maliki_id, '2025-02-06'),
('S0136464525', @kelas_maliki_id, '2025-02-06'),
('S0197744764', @kelas_maliki_id, '2025-02-06'),
('S0132216725', @kelas_maliki_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

