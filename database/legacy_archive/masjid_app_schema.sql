
-- =====================================
-- 1. USERS (Master table: all people)
-- =====================================
CREATE TABLE users (
    ic VARCHAR(20) PRIMARY KEY, -- Example: 051003060229
    nama VARCHAR(100) NOT NULL,
    umur INT,
    alamat VARCHAR(255),
    telefon VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('student','teacher','admin') NOT NULL,
    status ENUM('aktif','tidak_aktif','cuti') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- 2. STUDENTS (extension of users)
-- Note: kelas_id foreign key will be added after classes table is created
-- =====================================
CREATE TABLE students (
    user_ic VARCHAR(20) PRIMARY KEY,
    kelas_id INT,
    tarikh_daftar DATE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);

-- =====================================
-- 3. TEACHERS (extension of users)
-- =====================================
CREATE TABLE teachers (
    user_ic VARCHAR(20) PRIMARY KEY,
    kepakaran JSON, -- example: ["Al-Quran","Tajwid"]
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);

-- =====================================
-- 4. CLASSES
-- =====================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kelas VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    jadual VARCHAR(100),
    sessions JSON,
    yuran DECIMAL(10,2) DEFAULT 0,
    guru_ic VARCHAR(20),
    kapasiti INT DEFAULT 20,
    status ENUM('aktif', 'tidak_aktif', 'penuh') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_ic) REFERENCES users(ic) ON DELETE SET NULL
);

-- Add foreign key from students to classes (after classes table is created)
ALTER TABLE students ADD CONSTRAINT fk_students_classes FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL;

-- =====================================
-- 5. ATTENDANCE
-- =====================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    class_id INT,
    tarikh DATE,
    status ENUM('Hadir','Tidak Hadir','Cuti') DEFAULT 'Hadir',
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- =====================================
-- 6. EXAMS
-- =====================================
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    subject VARCHAR(100),
    tarikh_exam DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- =====================================
-- 7. RESULTS (with image path)
-- =====================================
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    exam_id INT,
    markah INT,
    gred VARCHAR(5),
    slip_img VARCHAR(255),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- =====================================
-- 8. FEES (with image path)
-- =====================================
CREATE TABLE fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    jumlah DECIMAL(10,2),
    status ENUM('Bayar','Belum Bayar','terbayar','tunggak','pending') DEFAULT 'Belum Bayar',
    tarikh DATE,
    tarikh_bayar DATE,
    bulan VARCHAR(20),
    tahun INT,
    cara_bayar VARCHAR(50),
    no_resit VARCHAR(50),
    resit_img VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE
);

-- =====================================
-- INSERT DEMO DATA
-- =====================================

-- USERS
INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
VALUES
('051003-06-0229', 'Ahmad Zulkifli', 20, 'Kampung Baru, Kuala Lumpur', '0123456789', 'ahmad@student.com', '123456', 'student', 'aktif'),
('040502-07-0118', 'Siti Aisyah', 21, 'Shah Alam, Selangor', '0139876543', 'siti@student.com', '123456', 'student', 'aktif'),
('820503-06-0229', 'Ustaz Rahim', 42, 'Bangi, Selangor', '0172233445', 'rahim@teacher.com', '123456', 'teacher', 'aktif'),
('790204-03-0117', 'Ustazah Nur', 45, 'Seremban, Negeri Sembilan', '0163344556', 'nur@teacher.com', '123456', 'teacher', 'aktif'),
('990101-01-0101', 'Admin Sistem', 35, 'Putrajaya', '0191112223', 'admin@madrasah.com', '123456', 'admin', 'aktif');

-- TEACHERS
INSERT INTO teachers (user_ic, kepakaran)
VALUES
('820503-06-0229', JSON_ARRAY('Al-Quran', 'Tajwid')),
('790204-03-0117', JSON_ARRAY('Fiqh', 'Aqidah'));

-- CLASSES
INSERT INTO classes (nama_kelas, level, jadual, sessions, yuran, guru_ic, kapasiti, status)
VALUES
('Al-Quran Asas', 'Asas', 'Isnin & Rabu 5:00AM-6:30AM', JSON_ARRAY('Isnin', 'Rabu'), 150.00, '820503-06-0229', 20, 'aktif'),
('Tajwid Pertengahan', 'Pertengahan', 'Selasa & Khamis 5:00AM-6:30AM', JSON_ARRAY('Selasa', 'Khamis'), 150.00, '790204-03-0117', 20, 'aktif');

-- STUDENTS
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
VALUES
('051003-06-0229', 1, '2025-01-15'),
('040502-07-0118', 2, '2025-01-20');

-- ATTENDANCE
INSERT INTO attendance (student_ic, class_id, tarikh, status, catatan)
VALUES
('051003-06-0229', 1, '2025-10-01', 'Hadir', NULL),
('051003-06-0229', 1, '2025-10-02', 'Tidak Hadir', 'Sakit'),
('040502-07-0118', 2, '2025-10-01', 'Hadir', NULL);

-- EXAMS
INSERT INTO exams (class_id, subject, tarikh_exam)
VALUES
(1, 'Tilawah Al-Quran', '2025-09-15'),
(2, 'Tajwid', '2025-09-18');

-- RESULTS
INSERT INTO results (student_ic, exam_id, markah, gred, slip_img, catatan)
VALUES
('051003-06-0229', 1, 88, 'A', 'uploads/slip_ahmad.png', 'Prestasi cemerlang'),
('040502-07-0118', 2, 75, 'B', 'uploads/slip_siti.png', NULL);

-- FEES
INSERT INTO fees (student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
VALUES
('051003-06-0229', 150.00, 'terbayar', '2025-02-01', '2025-02-01', 'Februari', 2025, 'Tunai', 'R001', 'uploads/resit_ahmad.png'),
('040502-07-0118', 150.00, 'tunggak', '2025-02-01', NULL, 'Februari', 2025, NULL, NULL, NULL);
