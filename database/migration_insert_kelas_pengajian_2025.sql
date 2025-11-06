-- ==============================================
-- DATABASE MIGRATION: Insert Kelas Pengajian 2025 Data
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script inserts the provided class data into the existing masjid_app database
-- It will create teachers and classes based on the provided data

-- ====================================================
-- IMPORTANT: Run this script in the masjid_app database
-- ====================================================
-- Use: USE masjid_app; or connect to masjid_app database before running

-- ====================================================
-- HELPER: Function to generate IC from name (for teachers without IC)
-- ====================================================
-- Note: In production, you should use actual IC numbers
-- This generates a placeholder IC based on the teacher's name
-- Format: T[phone_number] (e.g., T0139000168)

-- ====================================================
-- STEP 1: INSERT TEACHERS (Users with role='teacher')
-- ====================================================
-- First, we'll insert unique teachers from the data
-- Using a temporary IC format: T[hash] for teachers without real IC

INSERT INTO users (ic, nama, telefon, role, status) VALUES
-- ASAS teachers
('T0139000168', 'USTAZ MOHAMMAD WAZAR BIN MOHD DAWI', '0139000168', 'teacher', 'aktif'),
('T0162457106', 'USTAZ MUHAMMAD IHSAN BIN MHD ZAHARI', '0162457106', 'teacher', 'aktif'),
('T0199750534', 'USTAZ MOHD SAIFUL BAHARI BIN KASIM', '0199750534', 'teacher', 'aktif'),
('T0139046113', 'USTAZ A.ZUNNOR BIN ABD RAHMAN', '0139046113', 'teacher', 'aktif'),
('T0103949789', 'USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM', '0103949789', 'teacher', 'aktif'),

-- TAHSIN ASAS teachers
('T0129516044', 'USTAZ ZULKIFLI BIN YAAKUB', '0129516044', 'teacher', 'aktif'),
('T01137580463', 'USTAZ MUHAMMAD HASRIQ AZAMIE BIN SAIDI', '01137580463', 'teacher', 'aktif'),

-- PERTENGAHAN teachers
('T0199706272', 'USTAZ MOHD NOOR BIN DIN', '0199706272', 'teacher', 'aktif'),
('T0129571959', 'USTAZ MOHD NIZAM BIN ABDUL GHANI', '0129571959', 'teacher', 'aktif'),
('T0136148671', 'USTAZ AHMAD BURHANUDDIN BIN ABDUL AZIZ', '0136148671', 'teacher', 'aktif'),
('T0148345656', 'USTAZ MUHAMMAD SOLAHUDDIN BIN SAMSUDDIN', '0148345656', 'teacher', 'aktif'),

-- LANJUTAN teachers
('T0199684539', 'USTAZ MUHAMMAD HAFIZUDDIN BIN TAJUDDIN', '0199684539', 'teacher', 'aktif'),
('T0199165897', 'USTAZ AMIR HASIF BIN HATA', '0199165897', 'teacher', 'aktif'),
('T0199390972', 'USTAZ SHAIFUDDIN BIN NGAH', '0199390972', 'teacher', 'aktif'),

-- TAHSIN LANJUTAN teachers
('T0139424413', 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', '0139424413', 'teacher', 'aktif'),

-- TALAQQI teachers
('T0129457975', 'USTAZ MOHD FADZLI BIN OTHMAN', '0129457975', 'teacher', 'aktif'),
('T01111015704', 'USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF', '01111015704', 'teacher', 'aktif'),
('T0192902007', 'USTAZ HASRUL AZHAN BIN HARUN', '0192902007', 'teacher', 'aktif'),
('T0189678653', 'USTAZ MUHAMMAD SABRI BIN RAZALI', '0189678653', 'teacher', 'aktif'),
('T0134673494', 'USTAZ TENGKU FATHUL B TENGKU ABD MUTALIB', '0134673494', 'teacher', 'aktif'),
('T0129565849', 'USTAZ AHMAD ZAKRI BIN SALLEH', '0129565849', 'teacher', 'aktif'),
('T0199884408', 'USTAZ MOHD FADILAH BIN ABDUL MANAF', '0199884408', 'teacher', 'aktif'),
('T0139043035', 'USTAZ AHMAD REDZUAN BIN AMAT', '0139043035', 'teacher', 'aktif'),
('T0139222728', 'USTAZ MOHD HASNUL MINZAR BIN ISMAIL', '0139222728', 'teacher', 'aktif'),
('T0197278384', 'USTAZ MOHD SUKRI BIN CHE MAT', '0197278384', 'teacher', 'aktif'),
('T01115996053', 'USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN', '01115996053', 'teacher', 'aktif'),
('T01121621582', 'USTAZ MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI', '01121621582', 'teacher', 'aktif'),
('T0148391236', 'USTAZ FARIDNUDDIN BIN MUHAMAD', '0148391236', 'teacher', 'aktif'),
('T01110637156', 'USTAZ MUHAMMAD IKHRAM BIN ZAINAL', '01110637156', 'teacher', 'aktif'),
('T0139095315', 'USTAZ SULAIMAN BIN NORDIN', '0139095315', 'teacher', 'aktif'),
('T0139326688', 'USTAZ NASHARUDDIN BIN NGAH', '0139326688', 'teacher', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';

-- ====================================================
-- STEP 2: INSERT TEACHERS (teacher profiles)
-- ====================================================
INSERT INTO teachers (user_ic, kepakaran) VALUES
('T0139000168', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0162457106', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0199750534', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0139046113', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0103949789', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0129516044', JSON_ARRAY('Tahsin', 'Al-Quran')),
('T01137580463', JSON_ARRAY('Tahsin', 'Al-Quran')),
('T0199706272', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0129571959', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0136148671', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0148345656', JSON_ARRAY('Al-Quran', 'Tajwid')),
('T0199684539', JSON_ARRAY('Al-Quran', 'Tajwid', 'Lanjutan')),
('T0199165897', JSON_ARRAY('Al-Quran', 'Tajwid', 'Lanjutan')),
('T0199390972', JSON_ARRAY('Al-Quran', 'Tajwid', 'Lanjutan')),
('T0139424413', JSON_ARRAY('Tahsin', 'Al-Quran', 'Lanjutan')),
('T0129457975', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T01111015704', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0192902007', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0189678653', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0134673494', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0129565849', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0199884408', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0139043035', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0139222728', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0197278384', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T01115996053', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T01121621582', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0148391236', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T01110637156', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0139095315', JSON_ARRAY('Talaqqi', 'Al-Quran')),
('T0139326688', JSON_ARRAY('Talaqqi', 'Al-Quran'))

ON DUPLICATE KEY UPDATE kepakaran = VALUES(kepakaran);

-- ====================================================
-- STEP 3: INSERT CLASSES
-- ====================================================
-- Mapping: peringkat → level, jadual_hari + jadual_waktu → jadual, jadual_hari → sessions (JSON)
-- lokasi_kod + lokasi_nama → nama_kelas, bil_pelajar → kapasiti (and status if full)

INSERT INTO classes (nama_kelas, level, jadual, sessions, yuran, guru_ic, kapasiti, status) VALUES
-- ASAS
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0139000168', 20, 'aktif'),
('ASAS - IMAM MALIKI (4IM)', 'ASAS', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0162457106', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199750534', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139046113', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T0103949789', 20, 'aktif'),

-- TAHSIN ASAS
('TAHSIN ASAS - IMAM MALIKI (4IM)', 'TAHSIN ASAS', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0129516044', 20, 'aktif'),
('TAHSIN ASAS - IMAM MALIKI (4IM)', 'TAHSIN ASAS', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T01137580463', 20, 'aktif'),

-- PERTENGAHAN
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0199706272', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0129571959', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0136148671', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139000168', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T0148345656', 20, 'aktif'),

-- LANJUTAN
('LANJUTAN - IMAM HANAFI (2IH)', 'LANJUTAN', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0199684539', 20, 'aktif'),
('LANJUTAN - IMAM SYAFIE (2IS)', 'LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199165897', 20, 'aktif'),
('LANJUTAN - IMAM HANAFI (2IH)', 'LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199390972', 20, 'aktif'),

-- TAHSIN LANJUTAN
('TAHSIN LANJUTAN - IMAM HAMBALI (2IHb)', 'TAHSIN LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139424413', 20, 'aktif'),

-- TALAQQI (ISNIN & RABU)
('TALAQQI - IMAM SYAFIE (4IS)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0129457975', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (2IM)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T01111015704', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (4IHb)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0192902007', 20, 'aktif'),
('TALAQQI - IMAM HANAFI (2IH)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0189678653', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (3IHb)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0134673494', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (2IHb)', 'TALAQQI', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0129565849', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (3IHb)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0199884408', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (1IM)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T01111015704', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (2IHb)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0139043035', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (2IHb)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0139222728', 20, 'aktif'),
('TALAQQI - IMAM SYAFIE (2IS)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0189678653', 20, 'aktif'),
('TALAQQI - IMAM SYAFIE (5IS)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0197278384', 20, 'aktif'),
('TALAQQI - IMAM HANAFI (2IH)', 'TALAQQI', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T01115996053', 20, 'aktif'),

-- TALAQQI (SELASA & KHAMIS)
('TALAQQI - IMAM MALIKI (5IM)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T01121621582', 20, 'aktif'),
('TALAQQI - IMAM SYAFIE (2IS)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0148391236', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (1IM)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139222728', 20, 'aktif'),
('TALAQQI - IMAM HANAFI (2IH)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T01110637156', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (3IHb)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139095315', 20, 'aktif'),
('TALAQQI - IMAM HANAFI (1IH)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T01115996053', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (2IM)', 'TALAQQI', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139046113', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (4IHb)', 'TALAQQI', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199165897', 20, 'aktif'),
('TALAQQI - IMAM HAMBALI (2IHb)', 'TALAQQI', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0148391236', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (2IM)', 'TALAQQI', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199706272', 20, 'aktif'),
('TALAQQI - IMAM MALIKI (2IM)', 'TALAQQI', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139326688', 20, 'aktif'),
('TALAQQI - IMAM HANAFI (2IH)', 'TALAQQI', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199390972', 20, 'aktif');

-- ====================================================
-- NOTES:
-- 1. Teacher ICs are generated based on phone numbers (T + phone)
-- 2. If teachers already exist, they will be updated (ON DUPLICATE KEY UPDATE)
-- 3. Classes are created with default capacity of 20
-- 4. All classes are set to 'aktif' status
-- 5. Default yuran is set to 150.00
-- 6. You may want to update kapasiti and status based on bil_pelajar from original data
-- ====================================================

