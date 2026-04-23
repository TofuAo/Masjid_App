USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HANAFI
-- USTAZ MUHAMMAD SABRI BIN RAZALI
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0189678653', 'USTAZ MUHAMMAD SABRI BIN RAZALI', '0189678653', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0189678653', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name and teacher)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (2IH)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0189678653',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));

-- Create student users (handle duplicate phone numbers)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0146086863', 'AMINAH BT A. RAHIM', '0146086863', 'student', 'aktif'),
('S0179778246A', 'ENDOK SELOH BINTI ABDULLAH WAHAB', '0179778246', 'student', 'aktif'),
('S0129003301A', 'NORAISHAH BINTI KHAMALRUDIN', '0129003301', 'student', 'aktif'),
('S0199777313', 'WAN RUZAINI BT JOHARI', '0199777313', 'student', 'aktif'),
('S0142930881', 'ZAMRI BIN MOHAMED', '0142930881', 'student', 'aktif'),
('S0136971694', 'WAN FARIDAH BT WAN MAJID', '0136971694', 'student', 'aktif'),
('S0199313709', 'ALIAH BIN JUSOH', '0199313709', 'student', 'aktif'),
('S019983708', 'ININ BINTI AWI', '019983708', 'student', 'aktif'),
('S0179778246B', 'HASNAH BINTI OSMAN', '0179778246', 'student', 'aktif'),
('S0129833708', 'ROHAYATI BINTI AB. WAHAB', '0129833708', 'student', 'aktif'),
('S0129003301B', 'NORJULIAWATI BT ABDUL GHANI', '0129003301', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0146086863', @kelas_hanafi2_id, '2025-02-06'),
('S0179778246A', @kelas_hanafi2_id, '2025-02-06'),
('S0129003301A', @kelas_hanafi2_id, '2025-02-06'),
('S0199777313', @kelas_hanafi2_id, '2025-02-06'),
('S0142930881', @kelas_hanafi2_id, '2025-02-06'),
('S0136971694', @kelas_hanafi2_id, '2025-02-06'),
('S0199313709', @kelas_hanafi2_id, '2025-02-06'),
('S019983708', @kelas_hanafi2_id, '2025-02-06'),
('S0179778246B', @kelas_hanafi2_id, '2025-02-06'),
('S0129833708', @kelas_hanafi2_id, '2025-02-06'),
('S0129003301B', @kelas_hanafi2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

