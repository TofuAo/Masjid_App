USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 4 IMAM HAMBALI
-- USTAZ HASRUL AZHAN BIN HARUN
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0192902007', 'USTAZ HASRUL AZHAN BIN HARUN', '0192902007', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0192902007', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name and teacher)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0192902007' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (4IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0192902007',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali4_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (4IHb)' AND guru_ic = 'T0192902007' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0179441048', 'ROKIAH BINTI MAT RANI', '0179441048', 'student', 'aktif'),
('S0122602958', 'CHE ROHANI BINTI MOHAMED SALLEH', '0122602958', 'student', 'aktif'),
('S0199890507', 'PARISAH BINTI HJ TEL', '0199890507', 'student', 'aktif'),
('S0199266886', 'ROGAYAH BINTI OMAR', '0199266886', 'student', 'aktif'),
('S0139807447', 'RASLI BIN JAMIL', '0139807447', 'student', 'aktif'),
('S0199430767', 'AB AZIZ BIN ZAKARIA', '0199430767', 'student', 'aktif'),
('S01125637366', 'NORMAH BT IBRAHIM', '01125637366', 'student', 'aktif'),
('S0139894505', 'HJ. HAMIN BIN HJ. MOHAMAD', '0139894505', 'student', 'aktif'),
('S0179119155', 'MARIAM BINTI NGAH', '0179119155', 'student', 'aktif'),
('S0139349697', 'WAN FAIZAH BINTI WAN MAHMOOD', '0139349697', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0179441048', @kelas_hambali4_id, '2025-02-06'),
('S0122602958', @kelas_hambali4_id, '2025-02-06'),
('S0199890507', @kelas_hambali4_id, '2025-02-06'),
('S0199266886', @kelas_hambali4_id, '2025-02-06'),
('S0139807447', @kelas_hambali4_id, '2025-02-06'),
('S0199430767', @kelas_hambali4_id, '2025-02-06'),
('S01125637366', @kelas_hambali4_id, '2025-02-06'),
('S0139894505', @kelas_hambali4_id, '2025-02-06'),
('S0179119155', @kelas_hambali4_id, '2025-02-06'),
('S0139349697', @kelas_hambali4_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

