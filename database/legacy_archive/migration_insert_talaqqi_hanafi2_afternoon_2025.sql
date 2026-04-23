USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HANAFI (AFTERNOON)
-- USTAZ MUHAMMAD IKHRAM BIN ZAINAL
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01110637156', 'USTAZ MUHAMMAD IKHRAM BIN ZAINAL', '01110637156', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01110637156', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (2IH)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01110637156',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users (handle potential duplicate phone number for ROSMAH)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199217662', 'NOR ZAKIAH MANSOR', '0199217662', 'student', 'aktif'),
('S0179408366', 'FARIDAH BT MD. RADZUAN', '0179408366', 'student', 'aktif'),
('S0199584117', 'SALBIAH BTE ABD HAMID', '0199584117', 'student', 'aktif'),
('S0139363069', 'MOHD KHAIRUL ANUAR BIN MD MUSTAFA', '0139363069', 'student', 'aktif'),
('S0139373167', 'ROMANA BINTI RAM', '0139373167', 'student', 'aktif'),
('S01156747791', 'ROHANA BINTI HUSSIN', '01156747791', 'student', 'aktif'),
('S0179097585', 'MD MOKHTAR BIN ABDULLAH', '0179097585', 'student', 'aktif'),
('S01111249193', 'RASHIDAH BT SEMAN', '01111249193', 'student', 'aktif'),
('S01128941414B', 'ROSMAH BINTI ABD RAHMAN', '01128941414', 'student', 'aktif'),
('S0199887956', 'KHAFSAH BINTI MOHD SHAIEN', '0199887956', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199217662', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0179408366', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0199584117', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0139363069', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0139373167', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01156747791', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0179097585', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01111249193', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01128941414B', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0199887956', @kelas_talaqqi_hanafi2_id, '2025-02-12')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

