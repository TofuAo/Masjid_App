USE masjid_app;

-- =====================================================================
-- DATA: PERINGKAT TALAQQI - 5 IMAM SYAFI'E (EVENING)
-- USTAZ MOHD SUKRI BIN CHE MAT
-- Schedule: ISNIN & RABU (9.00 malam - 10.30 malam)
-- =====================================================================

-- Check if teacher exists, if not create teacher user
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('T0197278384', 'USTAZ MOHD SUKRI BIN CHE MAT', '0197278384', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Create teacher profile if not exists
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0197278384', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);

-- Find existing class with this teacher and schedule (use the most recent one)
SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (5IS)%' AND guru_ic = 'T0197278384' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);

-- If class doesn't exist, create it
INSERT INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM SYAFI''E (5IS)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0197278384',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;

-- Get the class ID (use existing or newly created)
SET @kelas_talaqqi_syafie5_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (5IS)' AND guru_ic = 'T0197278384' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));

-- Create student users
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S01171101345', 'NURUL IZZAH BT ABDUL RAHAMAN', '01171101345', 'student', 'aktif'),
('S01125528670', 'HISHAM BIN ZAINAL', '01125528670', 'student', 'aktif'),
('S0139314354', 'HASHIRAH BINTI AB HAMID', '0139314354', 'student', 'aktif'),
('S01132592894', 'CHE MUHAINI BINTI CHE BAHAROM', '01132592894', 'student', 'aktif'),
('S0179863624', 'ABDUL AZIZ BIN HAMZAH', '0179863624', 'student', 'aktif'),
('S0199567713', 'NORAINI BINTI ISMAIL', '0199567713', 'student', 'aktif'),
('S0139400930', 'ABDUL RANI BIN AWANG NGAH', '0139400930', 'student', 'aktif'),
('S0129687611', 'NASARULL SHAHRIN BIN MOHAMAD', '0129687611', 'student', 'aktif'),
('S0199895171', 'WAN ZAITUN BT WAN YAHYA', '0199895171', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);

-- Link all students to the class (WAN ZAITUN is already in this class from previous transfer)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S01171101345', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S01125528670', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0139314354', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S01132592894', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0179863624', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0199567713', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0139400930', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0129687611', @kelas_talaqqi_syafie5_id, '2025-02-06'),
('S0199895171', @kelas_talaqqi_syafie5_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);

