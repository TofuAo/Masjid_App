-- ==============================================
-- DATABASE MIGRATION: Insert Students for Kelas Pengajian 2025
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts student data into the existing masjid_app database
-- It will create student users and link them to their classes

-- ====================================================
-- STEP 1: INSERT STUDENTS (Users with role='student')
-- ====================================================
-- Generate IC numbers based on phone number for students without IC
-- Format: S[phone_number] (e.g., S0199560673)

-- KELAS 2 IMAM SYAFI'E - USTAZ AMIR HASIF BIN HATA
INSERT INTO users (ic, nama, telefon, role, status) VALUES
('S0199560673', 'Zainon Binti Othman', '019-9560673', 'student', 'aktif'),
('S0197362559', 'Mohd Nor Bin Nayan', '019-7362559', 'student', 'aktif'),
('S0197561030', 'Masrin Hanum Binti Mukhtar', '019-7561030', 'student', 'aktif'),
('S01110512489', 'Norizan Binti Mohamad', '011-10512489', 'student', 'aktif'),
('S0129467614', 'Noraida Binti Khamalrudin', '012-9467614', 'student', 'aktif'),
('S0179202406', 'Faridah Binti Daud', '017-9202406', 'student', 'aktif'),
('S0169244879', 'Fauziah Binti Abu Bakar', '016-9244879', 'student', 'aktif'),
('S0199529530', 'Nurul Nahar Binti Hj Abu Samah', '019-9529530', 'student', 'aktif'),
('S0139937234', 'Che Ku Shaherawati Binti Che Ku Jusoh', '013-9937234', 'student', 'aktif'),
('S0139287637', 'Zamali Bin Zainah', '013-9287637', 'student', 'aktif'),
('S01112199116', 'Bahriah Binti Mohd Nor', '011-12199116', 'student', 'aktif'),
('S0139303740', 'Mohd Noor Bin Yusof', '013-9303740', 'student', 'aktif'),
('S0199840155', 'Raselah Binti Abdul Hamid', '019-9840155', 'student', 'aktif'),
('S0199313190', 'Noorlin Binti Mohd Ali', '019-9313190', 'student', 'aktif'),
('S0139114072', 'Faizah Bt Ahmad', '013-9114072', 'student', 'aktif'),
('S0178122858', 'Fazilah Binti Hashim', '017-8122858', 'student', 'aktif'),
('S01152019494', 'Jaafar Bin Hussin', '011-52019494', 'student', 'aktif'),
('S0177303467', 'Marina Binti Ismail', '017-7303467', 'student', 'aktif'),
('S0196444227', 'Nor Ellyza Binti Md. Ghazali', '019-6444227', 'student', 'aktif'),
('S0172145530', 'Mohammad Sofee Bin Rahmat', '017-2145530', 'student', 'aktif'),
('S0197522010', 'Siti Nuraini Binti Mohd Samsuddin', '019-7522010', 'student', 'aktif'),
('S0135366710', 'Shauki Bin Md Saad', '013-5366710', 'student', 'aktif'),
('S0169598989', 'Redzwan Rahim Bin Mat', '016-9598989', 'student', 'aktif'),

-- KELAS 2 IMAM HANAFI - USTAZ SHAIFUDDIN BIN NGAH
('S0199525748', 'Sharifah Norhayati Bt Syed Abdulkadir', '019-9525748', 'student', 'aktif'),
('S0129508970', 'Norazita Binti Abdul Rahman', '012-9508970', 'student', 'aktif'),
('S0129082373', 'Shamsiah Binti Ibrahim', '012-9082373', 'student', 'aktif'),
('S0193600801', 'Mohd Azmi Bin Manap', '019-3600801', 'student', 'aktif'),
('S0199516107', 'Hashim Bin Mastor', '019-9516107', 'student', 'aktif'),
('S0173345154', 'Naemah Binti Omar', '017-3345154', 'student', 'aktif'),
('S0199371019', 'Tengku Abdul Halim Bin Tengku Abdul Rahman', '019-9371019', 'student', 'aktif'),
('S0199837383', 'Norhanom Binti Awang', '019-9837383', 'student', 'aktif'),
('S0138359597', 'Marzuki Bin Bujang', '013-8359597', 'student', 'aktif'),
('S0179717101', 'Maznah Binti Abdullah', '017-9717101', 'student', 'aktif'),

-- KELAS 2 IMAM HAMBALI - USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ
('S0132451715', 'Hasnizah Mohd Noh', '013-2451715', 'student', 'aktif'),
('S0199873239', 'Marlina Idayu Binti Ismail', '019-9873239', 'student', 'aktif'),
('S0199852115', 'Mohd Sawadihisam Bin Che Siok', '019-9852115', 'student', 'aktif'),
('S01155035710', 'Mohd Shukor Bin Mohd Noor', '011-55035710', 'student', 'aktif'),
('S01158509745', 'Muhammad Luqman Bin Khamalrudin', '011-58509745', 'student', 'aktif'),
('S0199283284', 'Samsuri Bin Sharun', '019-9283284', 'student', 'aktif'),
('S0199878760', 'Siti Mariam Binti Sheikh Mohamad', '019-9878760', 'student', 'aktif'),
('S0142137747', 'Nor Haslinda Binti Ismail', '014-2137747', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: LINK STUDENTS TO CLASSES
-- ====================================================
-- Find class IDs based on teacher and class name, then link students

-- First, get the class IDs for the three classes
-- We'll use a subquery to find the class IDs based on teacher IC and class name pattern

-- KELAS 2 IMAM SYAFI'E - USTAZ AMIR HASIF BIN HATA (T0199165897)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    CURDATE() as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0199165897' 
    AND nama_kelas LIKE '%IMAM SYAFIE%'
    AND level = 'LANJUTAN'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0199560673', 'S0197362559', 'S0197561030', 'S01110512489', 'S0129467614',
    'S0179202406', 'S0169244879', 'S0199529530', 'S0139937234', 'S0139287637',
    'S01112199116', 'S0139303740', 'S0199840155', 'S0199313190', 'S0139114072',
    'S0178122858', 'S01152019494', 'S0177303467', 'S0196444227', 'S0172145530',
    'S0197522010', 'S0135366710', 'S0169598989'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- KELAS 2 IMAM HANAFI - USTAZ SHAIFUDDIN BIN NGAH (T0199390972)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    CURDATE() as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0199390972' 
    AND nama_kelas LIKE '%IMAM HANAFI%'
    AND level = 'LANJUTAN'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0199525748', 'S0129508970', 'S0129082373', 'S0193600801', 'S0199516107',
    'S0173345154', 'S0199371019', 'S0199837383', 'S0138359597', 'S0179717101'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- KELAS 2 IMAM HAMBALI - USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ (T0139424413)
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    CURDATE() as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0139424413' 
    AND nama_kelas LIKE '%IMAM HAMBALI%'
    AND (level = 'TAHSIN LANJUTAN' OR level LIKE '%TAHSIN%')
    LIMIT 1
) c
WHERE u.ic IN (
    'S0132451715', 'S0199873239', 'S0199852115', 'S01155035710', 'S01158509745',
    'S0199283284', 'S0199878760', 'S0142137747'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);

-- ====================================================
-- NOTES:
-- 1. Student ICs are generated based on phone numbers (S + phone)
-- 2. If students already exist, they will be updated (ON DUPLICATE KEY UPDATE)
-- 3. Students are linked to classes based on teacher IC and class name pattern
-- 4. Registration date is set to current date
-- 5. You may need to update student ICs with real IC numbers if available
-- ====================================================

