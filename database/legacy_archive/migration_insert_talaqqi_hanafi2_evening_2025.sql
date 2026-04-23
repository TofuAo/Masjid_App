USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 2 IMAM HANAFI (EVENING)
-- USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T01115996053', 'USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN', '01115996053', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T01115996053', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Find existing class with this teacher and schedule
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T01115996053' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);

-- If class doesn't exist, create it
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (2IH)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T01115996053',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T01115996053' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0125907384', 'ROHAIDA BINTI MOHAMAD IDARIS', '0125907384', 'student', 'aktif'),
('S0139396645', 'MAZIAN BINTI JAAFAR', '0139396645', 'student', 'aktif'),
('S0148353177', 'RAMLAH BINTI SAMPAN', '0148353177', 'student', 'aktif'),
('S0139444543', 'ROHANA BT ABDULLAH', '0139444543', 'student', 'aktif'),
('S0199850450', 'BORHANUDDIN BIN HJ AZIZ', '0199850450', 'student', 'aktif'),
('S0199911656', 'RUSMANI BINTI YUNUS', '0199911656', 'student', 'aktif'),
('S0199876901', 'SITI NURIZAH BINTI KAMSIN', '0199876901', 'student', 'aktif'),
('S0199816410', 'ZALEHA MD YASIN', '0199816410', 'student', 'aktif'),
('S01125563087', 'MOHD SYAZANI BIN MOHD SALEH', '01125563087', 'student', 'aktif'),
('S0105286307', 'MOHD SHAMSUDDIN BIN ISMAIL', '0105286307', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0125907384', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0139396645', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0148353177', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0139444543', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0199850450', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0199911656', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0199876901', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0199816410', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S01125563087', @kelas_talaqqi_hanafi2_id, '2025-02-06'),
('S0105286307', @kelas_talaqqi_hanafi2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

