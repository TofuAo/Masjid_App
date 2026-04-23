-- ==============================================
-- DATABASE MIGRATION: Insert TAHSIN ASAS Level Students (USTAZ ZULKIFLI)
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- PERINGKAT: TAHSIN ASAS
-- TENAGA PENGAJAR: USTAZ ZULKIFLI BIN YAAKUB
-- ==============================================
-- This script inserts TAHSIN ASAS level student data into the existing masjid_app database
-- Class: 4 IMAM MALIKI
-- Schedule: SELASA & KHAMIS (9.00 malam - 10.30 malam)
-- Updated: 2025-02-04

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

-- TAHSIN ASAS - 4 IMAM MALIKI - USTAZ ZULKIFLI BIN YAAKUB
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199863810', 'SYED MOHD AMIN BIN SYED DERAHIN', '019-9863810', 'student', 'aktif'),
('S0139217817', 'MUHAMAD AZHA BIN ISMAIL', '013-9217817', 'student', 'aktif'),
('S0194002030', 'ARIFF BIN OTHMAN', '019-4002030', 'student', 'aktif'),
('S0199650133', 'AZMI BIN ALIAS', '019-9650133', 'student', 'aktif'),
('S0167272739', 'MOHD SAHARUDEEN BIN M. SHAMSUDEEN', '016-7272739', 'student', 'aktif'),
('S0123910284', 'MOHD ZIN BIN ISMAIL', '012-3910284', 'student', 'aktif'),
('S01329173022', 'MOHD AFENDI BIN KAMAL', '013-29173022', 'student', 'aktif'),
('S0139283850', 'KHAIRUL HASHIMY BIN MOHAMAD', '013-9283850', 'student', 'aktif'),
('S0194757757', 'MD ANUAR BIN MD SAAD', '019-4757757', 'student', 'aktif'),
('S0194757757A', 'ZALIFAH BINTI MAT RANI', '019-4757757', 'student', 'aktif'),
('S01157712354', 'MOHD NABIL ANIQ BIN MOHD KHAIRUDDIN', '011-57712354', 'student', 'aktif'),
('S0192944542', 'RAZMAN BIN RAZALI', '019-2944542', 'student', 'aktif'),
('S01120804537', 'ROHANI MUSA', '011-20804537', 'student', 'aktif'),
('S0129983064', 'MOHAMED BAKRI BIN ABU BAKAR', '012-9983064', 'student', 'aktif'),
('S0139140601', 'MOHD FAIZAL BIN MD YUSOF', '013-9140601', 'student', 'aktif'),
('S01139138004', 'MASLINDA BINTI MOHD NASIR', '011-39138004', 'student', 'aktif'),
('S0199325059', 'ZUBIDAH BT MD SHARIFF', '019-9325059', 'student', 'aktif'),
('S0199320059', 'MOHAMED SABADRI BIN MOHAMED ALI', '019-9320059', 'student', 'aktif'),
('S0199747572', 'FARISA BINTI ABDUL MALEK', '019-9747572', 'student', 'aktif'),
('S0199500170', 'MOHD AZRI BIN AZMI', '019-9500170', 'student', 'aktif'),
('S0199004750', 'AZIZUL BIN AZIZ', '019-9004750', 'student', 'aktif'),
('S0139544303', 'AZIZI BIN GHAZALI', '013-9544303', 'student', 'aktif'),
('S0112554074', 'ROSMANNY BIN DOLMAT @ MAT SANI', '011-2554074', 'student', 'aktif'),
('S0199983313', 'MOHAMAD AZAHARI BIN ABDUL WAHAB', '019-9983313', 'student', 'aktif'),
('S0195789603', 'MOHD HAZAMIL BIN HASHIM', '019-5789603', 'student', 'aktif')

-- Note: SYED MOHD AMRI (019-9863810) shares phone with SYED MOHD AMIN
-- Note: MD AZUANDY BIN MD ARIFFIN (S0148448959) already exists and is linked

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- Handle SYED MOHD AMRI (shares phone with SYED MOHD AMIN)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199863810A', 'SYED MOHD AMRI', '019-9863810', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASS
-- ====================================================

-- TAHSIN ASAS - 4 IMAM MALIKI - USTAZ ZULKIFLI BIN YAAKUB (T0129516044)
-- Schedule: SELASA & KHAMIS (9.00 malam - 10.30 malam)
-- Class ID: 8 (from previous query)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, 8, '2025-02-04' as tarikh_daftar
FROM users u
WHERE u.ic IN (
    'S0199863810', 'S0139217817', 'S0194002030', 'S0199650133', 'S0167272739',
    'S0123910284', 'S01329173022', 'S0139283850', 'S0194757757', 'S0194757757A',
    'S01157712354', 'S0192944542', 'S01120804537', 'S0129983064', 'S0139140601',
    'S01139138004', 'S0199325059', 'S0199320059', 'S0199747572', 'S0148448959', -- MD AZUANDY (already exists)
    'S0199500170', 'S0199004750', 'S0139544303', 'S0112554074', 'S0199983313',
    'S0195789603', 'S0199863810A' -- SYED MOHD AMRI
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone, spaces removed)
-- 2. MD AZUANDY BIN MD ARIFFIN (S0148448959) already exists and is linked to this class
-- 3. ZALIFAH BINTI MAT RANI shares phone with MD ANUAR BIN MD SAAD (019-4757757)
--    - Created with unique IC: S0194757757A
-- 4. SYED MOHD AMRI shares phone with SYED MOHD AMIN (019-9863810)
--    - Created with unique IC: S0199863810A
-- 5. Registration date set to 2025-02-04 (matching source data)
-- ====================================================

