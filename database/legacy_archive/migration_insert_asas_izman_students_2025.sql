-- ==============================================
-- DATABASE MIGRATION: Insert ASAS Level Students (USTAZ MUHAMMAD NUR IZMAN)
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- PERINGKAT ASAS - KELAS 4 IMAM HANAFI
-- TENAGA PENGAJAR: USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM
-- ==============================================
-- This script inserts ASAS level student data into the existing masjid_app database
-- Class: 4 IMAM HANAFI
-- Schedule: SABTU & AHAD (9.00 pagi - 10.30 pagi)
-- Updated: 11 Februari 2025

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================

-- ASAS - 4 IMAM HANAFI - USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0173584746', 'ABDUL KARIM BIN IBRAHIM', '017-3584746', 'student', 'aktif'),
('S0145359964', 'FAZIDAH BINTI ABDUL MAJID', '014-5359964', 'student', 'aktif'),
('S0199214499', 'NOOR DINI BINTI MAHMOOD', '019-9214499', 'student', 'aktif'),
('S01160732678', 'RAJA NOR HASINA BINTI RAJA IBRAHIM', '011-60732678', 'student', 'aktif'),
('S0102745236', 'ZARINA BINTI ABU', '010-2745236', 'student', 'aktif'),
('S0194179438', 'MOHAMAD SYAJIRY BIN SAIFUDDIN', '019-4179438', 'student', 'aktif'),
('S0138164020', 'TUAN KHAIRULL KHATIB BIN TUAN ABDULLAH', '013-8164020', 'student', 'aktif'),
('S0124088454', 'NURUL FATHIAH BINTI MOHD AMINUDDIN', '012-4088454', 'student', 'aktif'),
('S0172582997', 'ROZITA BINTI RAMLI', '017-2582997', 'student', 'aktif'),
('S0123714723', 'MARISSA BINTI MOHAMAD ZAID', '012-3714723', 'student', 'aktif'),
('S0179565248', 'ROZITA BINTI NGAH', '017-9565248', 'student', 'aktif'),
('S0139327488', 'MOHD AZME BIN BEDELAH', '013-9327488', 'student', 'aktif'),
('S0139284748', 'SUHAIMI BIN HUSSAIN', '013-9284748', 'student', 'aktif'),
('S0179067740', 'MAIMUNAH BINTI RAUF', '017-9067740', 'student', 'aktif'),
('S0173317367', 'NOR HAYATI BINTI M YUSOF LAU', '017-3317367', 'student', 'aktif'),
('S0104312762', 'MUHAMMAD ALI', '010-4312762', 'student', 'aktif'),
('S0142231064', 'NURUL AZIERA BINTI AZLIN', '014-2231064', 'student', 'aktif'),
('S0139324129', 'SITI NABILA HUSNA BINTI MOHD YUNOS', '013-9324129', 'student', 'aktif'),
('S0199844865', 'NOR ASHIKIN BINTI JAMALUDIN', '019-9844865', 'student', 'aktif'),
-- HUSIN BIN MUHAMMAD ALI - no phone number, generate IC from name
('SHUSIN001', 'HUSIN BIN MUHAMMAD ALI', NULL, 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = COALESCE(VALUES(telefon), telefon),
    status = 'aktif';

-- Note: DZAWANI BT MUHAMAD (S0199883655) already exists and is linked
-- Note: NORHASIMAH BINTI AMAT (S0193565278) already exists from TAHSIN ASAS
-- Note: MUFQI DANISH and MUFQI IERFAN share same phone (017-9565248) with ROZITA BINTI NGAH
--       They need separate ICs, but we'll use the phone number for now

-- Handle MUFQI siblings (same phone as ROZITA)
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0179565248A', 'MUFQI DANISH IQBAL BIN MOHD AZME', '017-9565248', 'student', 'aktif'),
('S0179565248B', 'MUFQI IERFAN HAFIZD BIN MOHD AZME', '017-9565248', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASS
-- ====================================================

-- ASAS - 4 IMAM HANAFI - USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM (T0103949789)
-- Schedule: SABTU & AHAD (9.00 pagi - 10.30 pagi)
-- Class ID: 7 (from previous query)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, 7, '2025-02-11' as tarikh_daftar
FROM users u
WHERE u.ic IN (
    'S0173584746', 'S0145359964', 'S0199214499', 'S01160732678', 'S0102745236',
    'S0194179438', 'S0138164020', 'S0124088454', 'S0193565278', -- NORHASIMAH (update from TAHSIN ASAS)
    'S0172582997', 'S0123714723', 'S0179565248', 'S0139327488', 'S0139284748',
    'S0179067740', 'S0173317367', 'S0199883655', -- DZAWANI (already linked, update date)
    'S0104312762', 'S0142231064', 'S0179565248A', 'S0179565248B',
    'SHUSIN001'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- STEP 3: HANDLE STUDENT TRANSFERS (based on catatan)
-- ====================================================

-- NOR ASHIKIN BINTI JAMALUDIN - Transfer to TAHSIN ASAS (US HASRIQ - T01137580463)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T01137580463' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'TAHSIN ASAS'
    AND jadual LIKE '%SABTU%AHAD%'
    LIMIT 1
)
WHERE u.ic = 'S0199844865'
AND u.nama LIKE '%NOR ASHIKIN%';

-- SITI NABILA HUSNA BINTI MOHD YUNOS - Transfer to PERTENGAHAN (US SOLAHUDDIN - T0148345656)
UPDATE students s
JOIN users u ON s.user_ic = u.ic
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0148345656' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'PERTENGAHAN'
    LIMIT 1
)
WHERE u.ic = 'S0139324129'
AND u.nama LIKE '%SITI NABILA HUSNA%';

-- ====================================================
-- NOTES:
-- 1. DZAWANI BT MUHAMAD already linked to this class (from previous migration)
-- 2. NORHASIMAH BINTI AMAT moved from TAHSIN ASAS to ASAS
-- 3. MUFQI siblings share phone with ROZITA BINTI NGAH - using unique ICs
-- 4. HUSIN BIN MUHAMMAD ALI has no phone - using generated IC
-- 5. Registration date set to 2025-02-11 (matching source data)
-- 6. Two students transferred per catatan notes
-- ====================================================

