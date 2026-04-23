-- ==============================================
-- DATABASE MIGRATION: Insert Additional Students for Kelas Pengajian 2025
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts additional student data for:
-- 1. TAHSIN ASAS - 4 IMAM MALIKI
-- 2. TAHSIN LANJUTAN - 2 IMAM HAMBALI (with updates)

-- ====================================================
-- STEP 1: INSERT NEW STUDENTS (Users with role='student')
-- ====================================================

-- TAHSIN ASAS - 4 IMAM MALIKI students
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0139273544', 'NOOR ANITA BINTI HASAN', '013-9273544', 'student', 'aktif'),
('S0166762445', 'MARIYATON BT MOHAMED JUSOH', '016-6762445', 'student', 'aktif'),
('S0129465850', 'ADLIN AFIQAH BT SUHAIMI', '012-9465850', 'student', 'aktif'),
('S0193565278', 'NORHASIMAH BINTI AMAT', '019-3565278', 'student', 'aktif'),
('S01139130562', 'NURREYNI MARTIZA BINTI MUHAMMAD ALI', '011-39130562', 'student', 'aktif'),
('S0199813029', 'ZAHARIAH BINTI MOHAMAD', '019-9813029', 'student', 'aktif'),
('S0177078384', 'SITI SURIA BINTI HAJI SHEIKH SALIM', '017-7078384', 'student', 'aktif'),
('S0139149723', 'RUHANI BT AWANG', '013-9149723', 'student', 'aktif'),
('S0199844865', 'NORASHIKIN BT JAMALUDIN', '019-9844865', 'student', 'aktif'),

-- TAHSIN LANJUTAN - 2 IMAM HAMBALI students (new ones not in previous migration)
('S0139271726', 'LAILA KARTINI BINTI CHE AB RAHMAN', '013-9271726', 'student', 'aktif'),
('S0199141303', 'RITA ERIYANA BINTI ABDULLAH SANI', '019-9141303', 'student', 'aktif'),
('S0139199070', 'SAMSUL BAHARIN BIN MUSTAFA', '013-9199070', 'student', 'aktif'),
('S0148153427', 'AWANG MERAH BIN ABDULLAH', '014-8153427', 'student', 'aktif'),
('S0138683610', 'ROSINA MOHAMED', '013-8683610', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASSES
-- ====================================================

-- TAHSIN ASAS - 4 IMAM MALIKI
-- Teacher: USTAZ MUHAMMAD HASRIQ AZAMIE BIN SAIDI (T01137580463)
-- Schedule: SABTU & AHAD (9.00 pagi - 10.30 pagi)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-06' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T01137580463' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'TAHSIN ASAS'
    AND jadual LIKE '%SABTU%AHAD%'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0139273544', 'S0166762445', 'S0129465850', 'S0193565278', 'S01139130562',
    'S0199813029', 'S0177078384', 'S0139149723', 'S0199844865'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- TAHSIN LANJUTAN - 2 IMAM HAMBALI
-- Teacher: USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ (T0139424413)
-- Schedule: SELASA & KHAMIS (5.00 petang - 6.30 petang)
-- Note: Some students have notes about transferring to other classes
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-07' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0139424413' 
    AND nama_kelas LIKE '%IMAM HAMBALI%'
    AND level = 'TAHSIN LANJUTAN'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0132451715', -- HASNIZAH MOHD NOH (already exists from previous migration)
    'S0139271726', -- LAILA KARTINI (has transfer note)
    'S0199873239', -- MARLINA IDAYU (already exists from previous migration)
    'S0199852115', -- MOHD SAWADIHISAM (already exists from previous migration)
    'S01155035710', -- MOHD SHUKOR (already exists from previous migration)
    'S01158509745', -- MUHAMMAD LUQMAN (already exists from previous migration)
    'S0169598989', -- REDZWAN RAHIM (has transfer note - already exists, but should be in different class)
    'S0199141303', -- RITA ERIYANA (has transfer note)
    'S0199283284', -- SAMSURI (already exists from previous migration)
    'S0199878760', -- SITI MARIAM (already exists from previous migration)
    'S0142137747', -- NOR HASLINDA (already exists from previous migration)
    'S0139199070', -- SAMSUL BAHARIN (new)
    'S0148153427', -- AWANG MERAH (new)
    'S0138683610'  -- ROSINA MOHAMED (new)
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- STEP 3: HANDLE STUDENT TRANSFERS (based on catatan)
-- ====================================================
-- Students with transfer notes should be moved to different classes

-- LAILA KARTINI - Transfer to LANJUTAN (US SHAIFUDDIN - T0199390972)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
JOIN classes c ON s.kelas_id = c.id
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0199390972' 
    AND nama_kelas LIKE '%IMAM HANAFI%'
    AND level = 'LANJUTAN'
    LIMIT 1
)
WHERE u.ic = 'S0139271726'
AND u.nama LIKE '%LAILA KARTINI%';

-- REDZWAN RAHIM - Transfer to LANJUTAN (US AMIR - T0199165897)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
JOIN classes c ON s.kelas_id = c.id
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0199165897' 
    AND nama_kelas LIKE '%IMAM SYAFIE%'
    AND level = 'LANJUTAN'
    LIMIT 1
)
WHERE u.ic = 'S0169598989'
AND u.nama LIKE '%REDZWAN%';

-- RITA ERIYANA - Transfer to LANJUTAN (US SHAIFUDDIN - T0199390972)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
JOIN classes c ON s.kelas_id = c.id
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0199390972' 
    AND nama_kelas LIKE '%IMAM HANAFI%'
    AND level = 'LANJUTAN'
    LIMIT 1
)
WHERE u.ic = 'S0199141303'
AND u.nama LIKE '%RITA ERIYANA%';

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone)
-- 2. Some students already exist from previous migration
-- 3. Transfer notes are handled by updating kelas_id
-- 4. Registration dates match the tarikh_kemaskini from source data
-- ====================================================

