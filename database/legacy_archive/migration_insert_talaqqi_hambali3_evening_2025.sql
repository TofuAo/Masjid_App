USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 3 IMAM HAMBALI (EVENING)
-- USTAZ MOHD FADILAH BIN ABDUL MANAF
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0199884408', 'USTAZ MOHD FADILAH BIN ABDUL MANAF', '0199884408', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0199884408', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0199884408' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0199884408',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali3_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0199884408' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0122193614', 'AHMAD SHAIFUDDIN B ABDUL MANAF', '0122193614', 'student', 'aktif'),
('S0179119600', 'HAMDAN BIN MOHD SAHAL', '0179119600', 'student', 'aktif'),
('S0179119644', 'NOR DALILA BT ABD KARIM', '0179119644', 'student', 'aktif'),
('S0137592214', 'NOR AZIZAH BINTI ZAKAWI', '0137592214', 'student', 'aktif'),
('S0199166786', 'MANAHNI BT MOHAMAD', '0199166786', 'student', 'aktif'),
('S0145040650', 'ZAINAB BT MUDA', '0145040650', 'student', 'aktif'),
('S01137434469', 'SADIAH BT MUDA', '01137434469', 'student', 'aktif'),
('S0145454292', 'ZALILAH BT ADAM', '0145454292', 'student', 'aktif'),
('S0139277323', 'NOOR HUBAIDA BT DAUD', '0139277323', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0122193614', @kelas_hambali3_evening_id, '2025-02-06'),
('S0179119600', @kelas_hambali3_evening_id, '2025-02-06'),
('S0179119644', @kelas_hambali3_evening_id, '2025-02-06'),
('S0137592214', @kelas_hambali3_evening_id, '2025-02-06'),
('S0199166786', @kelas_hambali3_evening_id, '2025-02-06'),
('S0145040650', @kelas_hambali3_evening_id, '2025-02-06'),
('S01137434469', @kelas_hambali3_evening_id, '2025-02-06'),
('S0145454292', @kelas_hambali3_evening_id, '2025-02-06'),
('S0139277323', @kelas_hambali3_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

