USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM SYAFI'E (AFTERNOON)
-- USTAZ FARIDNUDDIN BIN MUHAMAD
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0148391236', 'USTAZ FARIDNUDDIN BIN MUHAMAD', '0148391236', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0148391236', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Create the class (check if it already exists by name, teacher, and schedule)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (2IS)%' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);

-- Only insert if class doesn't exist
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM SYAFI''E (2IS)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0148391236',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_syafie2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (2IS)' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users (handle SITI HAWA with no phone number)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0139845534', 'MAIMAH BT OSMAN', '0139845534', 'student', 'aktif'),
('S0199161884', 'NOR''AIN BINTI OSMAN', '0199161884', 'student', 'aktif'),
('S0139272151', 'RAHIMAH BINTI DOL', '0139272151', 'student', 'aktif'),
('S0139375763', 'NORA BINTI MAARIS', '0139375763', 'student', 'aktif'),
('S0199323858', 'OTHMAN BIN MOHAMMAD', '0199323858', 'student', 'aktif'),
('S0139812099', 'AZIZAH BINTI RASHID', '0139812099', 'student', 'aktif'),
('S0139278575', 'ABDUL GHANI BIN IBRAHIM', '0139278575', 'student', 'aktif'),
('S0199820872', 'ZAIMAH BINTI DOL', '0199820872', 'student', 'aktif'),
('S01110815345', 'CHE ROHANA BINTI RAMLI', '01110815345', 'student', 'aktif'),
('S0134855026', 'ZARINA BINTI ABD RANI', '0134855026', 'student', 'aktif'),
('SSITIHAWA001', 'SITI HAWA', NULL, 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139845534', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199161884', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139272151', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139375763', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199323858', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139812099', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139278575', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199820872', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S01110815345', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0134855026', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('SSITIHAWA001', @kelas_talaqqi_syafie2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

