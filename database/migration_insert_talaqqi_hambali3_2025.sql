USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 3 IMAM HAMBALI
-- USTAZ TENGKU FATHUL B TENGKU ABD MUTALIB
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0134673494', 'USTAZ TENGKU FATHUL B TENGKU ABD MUTALIB', '0134673494', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0134673494', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name and teacher)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0134673494' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0134673494',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali3_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0134673494' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199502289', 'ROSILAWATI BINTI ZAKARIA', '0199502289', 'student', 'aktif'),
('S0139593943', 'SHAMSIAH BINTI OTHMAN', '0139593943', 'student', 'aktif'),
('S0195115358', 'NURULSHUHADA BINTI MAT NOR', '0195115358', 'student', 'aktif'),
('S0199522332', 'NORHAYATI BINTI ABD AZIZ', '0199522332', 'student', 'aktif'),
('S0148338913', 'RUHANI BINTI MD ISA', '0148338913', 'student', 'aktif'),
('S0139115776', 'DIANARISA BINTI MOHD BADRI', '0139115776', 'student', 'aktif'),
('S0139802535', 'KHADZIJAH BINTI IBRAHIM', '0139802535', 'student', 'aktif'),
('S0179408807', 'NOR AZNI BINTI WAHAB', '0179408807', 'student', 'aktif'),
('S0145055462', 'NOOR AZIZAN BINTI ABD AZIZ', '0145055462', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199502289', @kelas_hambali3_id, '2025-02-06'),
('S0139593943', @kelas_hambali3_id, '2025-02-06'),
('S0195115358', @kelas_hambali3_id, '2025-02-06'),
('S0199522332', @kelas_hambali3_id, '2025-02-06'),
('S0148338913', @kelas_hambali3_id, '2025-02-06'),
('S0139115776', @kelas_hambali3_id, '2025-02-06'),
('S0139802535', @kelas_hambali3_id, '2025-02-06'),
('S0179408807', @kelas_hambali3_id, '2025-02-06'),
('S0145055462', @kelas_hambali3_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

