-- =====================================
-- DATABASE MIGRATION: Update Schema to Match Application Requirements
-- =====================================
-- This script updates the database schema to match what the controllers expect
-- Run this AFTER the initial schema creation

USE masjid_app;

-- =====================================
-- 1. UPDATE CLASSES TABLE
-- =====================================
-- Add missing fields that controllers require
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS level VARCHAR(50) AFTER nama_kelas,
ADD COLUMN IF NOT EXISTS sessions JSON AFTER jadual,
ADD COLUMN IF NOT EXISTS yuran DECIMAL(10,2) DEFAULT 0 AFTER sessions,
ADD COLUMN IF NOT EXISTS kapasiti INT DEFAULT 20 AFTER yuran,
ADD COLUMN IF NOT EXISTS status ENUM('aktif', 'tidak_aktif', 'penuh') DEFAULT 'aktif' AFTER kapasiti;

-- Note: If MySQL version doesn't support IF NOT EXISTS, remove it:
-- ALTER TABLE classes
-- ADD COLUMN level VARCHAR(50) AFTER nama_kelas,
-- ADD COLUMN sessions JSON AFTER jadual,
-- ADD COLUMN yuran DECIMAL(10,2) DEFAULT 0 AFTER sessions,
-- ADD COLUMN kapasiti INT DEFAULT 20 AFTER yuran,
-- ADD COLUMN status ENUM('aktif', 'tidak_aktif', 'penuh') DEFAULT 'aktif' AFTER kapasiti;

-- =====================================
-- 2. UPDATE FEES TABLE
-- =====================================
-- Update status enum to match frontend expectations
ALTER TABLE fees
MODIFY COLUMN status ENUM('Bayar', 'Belum Bayar', 'terbayar', 'tunggak', 'pending') DEFAULT 'Belum Bayar';

-- Add missing fields
ALTER TABLE fees
ADD COLUMN IF NOT EXISTS tarikh_bayar DATE AFTER tarikh,
ADD COLUMN IF NOT EXISTS bulan VARCHAR(20) AFTER tarikh_bayar,
ADD COLUMN IF NOT EXISTS tahun INT AFTER bulan,
ADD COLUMN IF NOT EXISTS cara_bayar VARCHAR(50) AFTER tahun,
ADD COLUMN IF NOT EXISTS no_resit VARCHAR(50) AFTER cara_bayar;

-- Update existing data to use new format (optional, for compatibility)
-- UPDATE fees SET status = 'terbayar' WHERE status = 'Bayar';
-- UPDATE fees SET status = 'tunggak' WHERE status = 'Belum Bayar';

-- =====================================
-- 3. UPDATE RESULTS TABLE
-- =====================================
-- Add catatan field for notes
ALTER TABLE results ADD COLUMN IF NOT EXISTS catatan TEXT AFTER slip_img;

-- =====================================
-- 4. UPDATE ATTENDANCE TABLE
-- =====================================
-- Add catatan field for notes (if needed by application)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS catatan TEXT AFTER status;

-- =====================================
-- 5. UPDATE FOREIGN KEY RELATIONSHIPS
-- =====================================
-- Ensure all foreign keys are properly set up

-- Students -> Classes (add if missing)
-- Check if foreign key exists, if not add it:
-- ALTER TABLE students ADD CONSTRAINT fk_students_classes FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Classes -> Users (guru_ic)
-- Already exists: FOREIGN KEY (guru_ic) REFERENCES users(ic) ON DELETE SET NULL

-- Attendance -> Users, Classes
-- Already exists: FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE
-- Already exists: FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE

-- Results -> Users, Exams
-- Already exists: FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE
-- Already exists: FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE

-- Exams -> Classes
-- Already exists: FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE

-- Fees -> Users
-- Already exists: FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE

-- =====================================
-- 6. UPDATE DEFAULT VALUES FOR CLASSES
-- =====================================
-- Update existing classes with default values if they are NULL
UPDATE classes SET level = 'Asas' WHERE level IS NULL;
UPDATE classes SET sessions = '[]' WHERE sessions IS NULL;
UPDATE classes SET yuran = 0 WHERE yuran IS NULL;
UPDATE classes SET kapasiti = 20 WHERE kapasiti IS NULL;
UPDATE classes SET status = 'aktif' WHERE status IS NULL;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================
-- Run these to verify the schema updates:
-- DESCRIBE classes;
-- DESCRIBE fees;
-- DESCRIBE results;
-- DESCRIBE attendance;
