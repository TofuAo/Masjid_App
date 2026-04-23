USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 5 IMAM MALIKI
-- USTAZ MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01121621582', 'USTAZ MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI', '01121621582', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01121621582', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (5IM)%' AND guru_ic = 'T01121621582' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (5IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01121621582',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_maliki5_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (5IM)' AND guru_ic = 'T01121621582' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199263642', 'MOHAMAD BIN RIPIN', '0199263642', 'student', 'aktif'),
('S0169618649', 'SURIYATI BINTI MOHD LAZIM', '0169618649', 'student', 'aktif'),
('S0169352769', 'ZULKIFLI BIN RAMLI', '0169352769', 'student', 'aktif'),
('S0183999061', 'SITI RUKSHANA BINTI GULAM KHAN', '0183999061', 'student', 'aktif'),
('S0139939096', 'ROSELIZA HAIDA BT AHMAD', '0139939096', 'student', 'aktif'),
('S0129529850', 'ROHAYU BINTI MOHAMAD', '0129529850', 'student', 'aktif'),
('S01128941414', 'ROSMAWATI BINTI ABD RAHMAN', '01128941414', 'student', 'aktif'),
('S0199822802', 'RAJA SUHAINI BINTI RAJA SALLEHUDIN', '0199822802', 'student', 'aktif'),
('S0129509397', 'KHAMISAH BINTI MONSI', '0129509397', 'student', 'aktif'),
('S0199733012', 'FARAH NURAIN BINTI MUHAMMAD KHAIRUL ANUAR KANNUMALAR', '0199733012', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class (KHAMISAH will be transferred from previous class)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199263642', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0169618649', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0169352769', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0183999061', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0139939096', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0129529850', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S01128941414', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0199822802', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0129509397', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0199733012', @kelas_talaqqi_maliki5_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

