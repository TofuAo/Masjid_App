-- ==============================================
-- DATABASE MIGRATION: Insert Staff Teachers 2025
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts teachers from the staff list with their actual IC numbers
-- Default password for all teachers: password123
-- Teachers should change their password after first login

-- ====================================================
-- IMPORTANT: Run this script in the masjid_app database
-- ====================================================
-- Use: USE masjid_app; or connect to masjid_app database before running

-- Default hashed password (password123)
SET @default_password = '$2a$12$CxcoVvzrbONuSFZQmMNElOu0jVDNBBKshnEoIT7IMSPbHS6gKAKeG';

-- ====================================================
-- STEP 1: INSERT TEACHERS INTO USERS TABLE
-- ====================================================
-- Using INSERT IGNORE to skip existing teachers
INSERT IGNORE INTO users (ic, nama, telefon, role, status, password) VALUES
('7310140605251', 'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH', '010605251', 'teacher', 'aktif', @default_password),
('9507170605661', 'MUHAMMAD \'IZZAN BIN IDRIS', '010605661', 'teacher', 'aktif', @default_password),
('6603220605653', 'ZANAL ABIDIN BIN ISMAIL', '010605653', 'teacher', 'aktif', @default_password),
('7105150605193', 'A. ZUNNOR BIN ABD RAHMAN', '010605193', 'teacher', 'aktif', @default_password),
('7011080605175', 'MOHD NOOR BIN DIN', '010605175', 'teacher', 'aktif', @default_password),
('7401010605000', 'KHAIRUL AZZURA BINTI ISMAIL', '010605000', 'teacher', 'aktif', @default_password),
('7203230605059', 'SHAIFUDDIN BIN NGAH', '010605059', 'teacher', 'aktif', @default_password),
('9309290605390', 'SYAHIRAH AISYAH BINTI SUFIAN', '010605390', 'teacher', 'aktif', @default_password),
('9112100605097', 'MUHAMMAD IHSAN BIN MHD ZAHARI', '010605097', 'teacher', 'aktif', @default_password),
('9001020606005', 'MOHAMAD IZWANUDDIN BIN MOHD DAHALAN', '010606005', 'teacher', 'aktif', @default_password),
('8705260605845', 'SYED FIRMAN SYAMIL BIN SYED AFFENDY', '010605845', 'teacher', 'aktif', @default_password),
('7707040605541', 'AHMAD SHARIZAL BIN SAFFRIM', '010605541', 'teacher', 'aktif', @default_password),
('8110260605435', 'MOHD HASBULLAH BIN ABDULLAH @ ISMAIL', '010605435', 'teacher', 'aktif', @default_password),
('9203120605113', 'AMIR HASIF BIN HATA', '010605113', 'teacher', 'aktif', @default_password),
('9605050605909', 'MUHAMMAD HAFIZUDDIN BIN TAJUDDIN', '010605909', 'teacher', 'aktif', @default_password),
('9512200605759', 'MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', '010605759', 'teacher', 'aktif', @default_password),
('9412180705641', 'MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', '010705641', 'teacher', 'aktif', @default_password),
('9211250605606', 'PUTRI ANATI BINTI AZAHAR', '010605606', 'teacher', 'aktif', @default_password),
('9512090605192', 'NURAIN NASUHA BINTI MOHD YUSOFF', '010605192', 'teacher', 'aktif', @default_password),
('9311290605047', 'AHMAD HAYATUL FAIZ BIN ABD LATIF', '010605047', 'teacher', 'aktif', @default_password),
('8407140205376', 'NABIJAH BINTI ZAKARIA', '010205376', 'teacher', 'aktif', @default_password),
('9111150605216', 'NURUL SYAZWANI AISYAH BINTI RUSLI', '010605216', 'teacher', 'aktif', @default_password),
('8910030605929', 'WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN', '010605929', 'teacher', 'aktif', @default_password),
('9901240605179', 'MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI', '010605179', 'teacher', 'aktif', @default_password),
('7203010605533', 'RUSDAN BIN ABDUL JALIL', '010605533', 'teacher', 'aktif', @default_password),
('6912220605287', 'MOHAMMAD WAZAR BIN MOHD DAWI', '010605287', 'teacher', 'aktif', @default_password),
('9910020106189', 'MOHAMAD SADIQ UMAIR BIN NAHAR', '010106189', 'teacher', 'aktif', @default_password);

-- ====================================================
-- STEP 2: INSERT TEACHERS INTO TEACHERS TABLE
-- ====================================================
-- Assigning random kepakaran (1-3 items per teacher)
-- Valid options: 'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'

INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('7310140605251', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fardhu Ain')),
('9507170605661', JSON_ARRAY('Al-Quran', 'Tajwid')),
('6603220605653', JSON_ARRAY('Fardhu Ain', 'Hadith')),
('7105150605193', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fiqh')),
('7011080605175', JSON_ARRAY('Seerah', 'Tafsir')),
('7401010605000', JSON_ARRAY('Al-Quran', 'Bahasa Arab')),
('7203230605059', JSON_ARRAY('Tajwid', 'Akidah')),
('9309290605390', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fardhu Ain')),
('9112100605097', JSON_ARRAY('Fiqh', 'Hadith')),
('9001020606005', JSON_ARRAY('Al-Quran', 'Tafsir')),
('8705260605845', JSON_ARRAY('Seerah', 'Bahasa Arab', 'Akidah')),
('7707040605541', JSON_ARRAY('Al-Quran', 'Tajwid')),
('8110260605435', JSON_ARRAY('Fardhu Ain', 'Fiqh')),
('9203120605113', JSON_ARRAY('Al-Quran', 'Tajwid', 'Tasawwuf')),
('9605050605909', JSON_ARRAY('Hadith', 'Seerah')),
('9512200605759', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fardhu Ain')),
('9412180705641', JSON_ARRAY('Tafsir', 'Bahasa Arab')),
('9211250605606', JSON_ARRAY('Al-Quran', 'Akidah')),
('9512090605192', JSON_ARRAY('Tajwid', 'Fiqh')),
('9311290605047', JSON_ARRAY('Al-Quran', 'Seerah', 'Tafsir')),
('8407140205376', JSON_ARRAY('Fardhu Ain', 'Hadith', 'Akidah')),
('9111150605216', JSON_ARRAY('Al-Quran', 'Tajwid')),
('8910030605929', JSON_ARRAY('Bahasa Arab', 'Tasawwuf')),
('9901240605179', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fiqh')),
('7203010605533', JSON_ARRAY('Seerah', 'Tafsir')),
('6912220605287', JSON_ARRAY('Al-Quran', 'Tajwid', 'Fardhu Ain')),
('9910020106189', JSON_ARRAY('Hadith', 'Fiqh', 'Akidah'));

-- ====================================================
-- VERIFICATION: Check inserted teachers
-- ====================================================
SELECT 
    u.ic,
    u.nama,
    u.telefon,
    u.status,
    t.kepakaran,
    COUNT(c.id) as total_classes
FROM users u
LEFT JOIN teachers t ON u.ic = t.user_ic
LEFT JOIN classes c ON u.ic = c.guru_ic
WHERE u.ic IN (
    '7310140605251', '9507170605661', '6603220605653', '7105150605193', '7011080605175',
    '7401010605000', '7203230605059', '9309290605390', '9112100605097', '9001020606005',
    '8705260605845', '7707040605541', '8110260605435', '9203120605113', '9605050605909',
    '9512200605759', '9412180705641', '9211250605606', '9512090605192', '9311290605047',
    '8407140205376', '9111150605216', '8910030605929', '9901240605179', '7203010605533',
    '6912220605287', '9910020106189'
)
GROUP BY u.ic, u.nama, u.telefon, u.status, t.kepakaran
ORDER BY u.nama;

