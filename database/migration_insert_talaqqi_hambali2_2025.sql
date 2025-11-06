USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HAMBALI
-- USTAZ AHMAD ZAKRI BIN SALLEH
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0129565849', 'USTAZ AHMAD ZAKRI BIN SALLEH', '0129565849', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0129565849', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name and teacher)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0129565849' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0129565849',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_hambali2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0129565849' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));

-- Create student users (handle AZIZAH BT DAUD who may already exist)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0129509397', 'KHAMISAH BINTI MONSI', '0129509397', 'student', 'aktif'),
('S0139823203', 'ASMAH BINTI AWANG', '0139823203', 'student', 'aktif'),
('S0199873011', 'FARIDAH OMAR', '0199873011', 'student', 'aktif'),
('S0162718832', 'HABSAH BINTI AHMAD', '0162718832', 'student', 'aktif'),
('S0199271828', 'UMI KALSOM BINTI KASIM', '0199271828', 'student', 'aktif'),
('S0139302535', 'MOHD KAMAL B MOHD ZIN', '0139302535', 'student', 'aktif'),
('S01110707404', 'NORIZAN BINTI IBRAHIM', '01110707404', 'student', 'aktif'),
('S0197744764', 'AZIZAH BT DAUD', '0197744764', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link students to the class
-- Note: If AZIZAH BT DAUD already exists in another class, this will update her class assignment
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129509397', @kelas_hambali2_id, '2025-02-04'),
('S0139823203', @kelas_hambali2_id, '2025-02-04'),
('S0199873011', @kelas_hambali2_id, '2025-02-04'),
('S0162718832', @kelas_hambali2_id, '2025-02-04'),
('S0199271828', @kelas_hambali2_id, '2025-02-04'),
('S0139302535', @kelas_hambali2_id, '2025-02-04'),
('S01110707404', @kelas_hambali2_id, '2025-02-04'),
('S0197744764', @kelas_hambali2_id, '2025-02-04')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

