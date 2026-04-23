




SET FOREIGN_KEY_CHECKS=0;







CREATE TABLE IF NOT EXISTS users (
    ic VARCHAR(20) PRIMARY KEY, 
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





CREATE TABLE IF NOT EXISTS students (
    user_ic VARCHAR(20) PRIMARY KEY,
    kelas_id INT,
    tarikh_daftar DATE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS teachers (
    user_ic VARCHAR(20) PRIMARY KEY,
    kepakaran JSON, 
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS classes (
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


ALTER TABLE students ADD CONSTRAINT fk_students_classes FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL;




CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    class_id INT,
    tarikh DATE,
    status ENUM('Hadir','Tidak Hadir','Cuti') DEFAULT 'Hadir',
    catatan TEXT,
    proof_image VARCHAR(255) NULL,
    marked_by VARCHAR(20) NULL,
    document_confirmed TINYINT(1) DEFAULT 0,
    confirmed_by VARCHAR(20) NULL,
    confirmed_at TIMESTAMP NULL,
    confirmation_notes TEXT NULL,
    approval_status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(ic) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_proof_image (proof_image),
    INDEX idx_attendance_document_confirmed (document_confirmed)
);




CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    subject VARCHAR(100),
    tarikh_exam DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS results (
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




CREATE TABLE IF NOT EXISTS fees (
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
    document_confirmed TINYINT(1) DEFAULT 0,
    confirmed_by VARCHAR(20) NULL,
    confirmed_at TIMESTAMP NULL,
    confirmation_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_fees_document_confirmed (document_confirmed)
);






INSERT IGNORE INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
VALUES
('051003-06-0229', 'Ahmad Zulkifli', 20, 'Kampung Baru, Kuala Lumpur', '0123456789', 'ahmad@student.com', '123456', 'student', 'aktif'),
('040502-07-0118', 'Siti Aisyah', 21, 'Shah Alam, Selangor', '0139876543', 'siti@student.com', '123456', 'student', 'aktif'),
('820503-06-0229', 'Ustaz Rahim', 42, 'Bangi, Selangor', '0172233445', 'rahim@teacher.com', '123456', 'teacher', 'aktif'),
('790204-03-0117', 'Ustazah Nur', 45, 'Seremban, Negeri Sembilan', '0163344556', 'nur@teacher.com', '123456', 'teacher', 'aktif'),
('990101-01-0101', 'Admin Sistem', 35, 'Putrajaya', '0191112223', 'admin@madrasah.com', '123456', 'admin', 'aktif');


INSERT IGNORE INTO teachers (user_ic, kepakaran)
VALUES
('820503-06-0229', JSON_ARRAY('Al-Quran', 'Tajwid')),
('790204-03-0117', JSON_ARRAY('Fiqh', 'Aqidah'));


INSERT IGNORE INTO classes (nama_kelas, level, jadual, sessions, yuran, guru_ic, kapasiti, status)
VALUES
('Al-Quran Asas', 'Asas', 'Isnin & Rabu 5:00AM-6:30AM', JSON_ARRAY('Isnin', 'Rabu'), 150.00, '820503-06-0229', 20, 'aktif'),
('Tajwid Pertengahan', 'Pertengahan', 'Selasa & Khamis 5:00AM-6:30AM', JSON_ARRAY('Selasa', 'Khamis'), 150.00, '790204-03-0117', 20, 'aktif');


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
VALUES
('051003-06-0229', 1, '2025-01-15'),
('040502-07-0118', 2, '2025-01-20');


INSERT IGNORE INTO attendance (student_ic, class_id, tarikh, status, catatan)
VALUES
('051003-06-0229', 1, '2025-10-01', 'Hadir', NULL),
('051003-06-0229', 1, '2025-10-02', 'Tidak Hadir', 'Sakit'),
('040502-07-0118', 2, '2025-10-01', 'Hadir', NULL);


INSERT IGNORE INTO exams (class_id, subject, tarikh_exam)
VALUES
(1, 'Tilawah Al-Quran', '2025-09-15'),
(2, 'Tajwid', '2025-09-18');


INSERT IGNORE INTO results (student_ic, exam_id, markah, gred, slip_img, catatan)
VALUES
('051003-06-0229', 1, 88, 'A', 'uploads/slip_ahmad.png', 'Prestasi cemerlang'),
('040502-07-0118', 2, 75, 'B', 'uploads/slip_siti.png', NULL);


INSERT IGNORE INTO fees (student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
VALUES
('051003-06-0229', 150.00, 'terbayar', '2025-02-01', '2025-02-01', 'Februari', 2025, 'Tunai', 'R001', 'uploads/resit_ahmad.png'),
('040502-07-0118', 150.00, 'tunggak', '2025-02-01', NULL, 'Februari', 2025, NULL, NULL, NULL);





CREATE TABLE IF NOT EXISTS pending_pic_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_key VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(191) NULL,
    request_method VARCHAR(10) NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    metadata JSON NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(20) NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    INDEX idx_pending_pic_changes_status (status),
    INDEX idx_pending_pic_changes_actor (created_by),
    INDEX idx_pending_pic_changes_entity (entity_type, entity_id)
);





ALTER TABLE users
MODIFY COLUMN role ENUM('student','teacher','admin','pic') NOT NULL DEFAULT 'student';





CREATE TABLE IF NOT EXISTS admin_action_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    operation ENUM('create', 'update', 'delete') NOT NULL,
    data JSON NOT NULL,
    metadata JSON,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    was_undone TINYINT(1) DEFAULT 0,
    undone_at TIMESTAMP NULL,
    INDEX idx_admin_snapshots_entity (entity_type, entity_id),
    INDEX idx_admin_snapshots_expires (expires_at),
    INDEX idx_admin_snapshots_created_by (created_by)
);



















DELETE FROM users WHERE REPLACE(ic, '-', '') = '920312065113';
INSERT IGNORE INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '920312065113',
  'USTAZ AMIR HASIF BIN HATA',
  '$2a$12$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


DELETE FROM users WHERE REPLACE(ic, '-', '') = '951220065759';
INSERT IGNORE INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '951220065759',
  'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ',
  '$2a$12$dzmNIzsRBST1EbjNDs75iOzLnWD54uKYeOscFH/eLPK6VC3g8bEve',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


DELETE FROM users WHERE REPLACE(ic, '-', '') = '941218075641';
INSERT IGNORE INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '941218075641',
  'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI',
  '$2a$12$HSZI9YHc60OGQB53Q0e8Bu7FCjpLpqZ4WpngiMMu8ec5fQm/F4xlG',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


SELECT ic, nama, role, status FROM users WHERE role = 'admin';








CREATE TABLE IF NOT EXISTS class_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_ic VARCHAR(20) NOT NULL COMMENT 'Student user_ic (IC)',
  class_id INT NOT NULL,
  assignment_type ENUM('permanent','exam') NOT NULL DEFAULT 'permanent',
  exam_session_id INT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ca_student (student_ic),
  INDEX idx_ca_class (class_id),
  INDEX idx_ca_active (is_active),
  INDEX idx_ca_dates (start_date, end_date),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student-class assignments: permanent + temporary exam';






CREATE TABLE IF NOT EXISTS exam_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_es_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;







CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_ic VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_admin (admin_ic),
  INDEX idx_al_created (created_at),
  INDEX idx_al_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;








ALTER TABLE users ADD COLUMN cover_photo VARCHAR(255) DEFAULT NULL;


ALTER TABLE students ADD COLUMN class_track VARCHAR(50) DEFAULT NULL COMMENT 'Full-Time, Part-Time, Online';
ALTER TABLE students ADD COLUMN academic_bio VARCHAR(255) DEFAULT NULL;


CREATE TABLE IF NOT EXISTS resit_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT NOT NULL,
  student_ic VARCHAR(20) NOT NULL,
  status ENUM('eligible', 'applied', 'confirmed') NOT NULL DEFAULT 'eligible',
  deadline DATE DEFAULT NULL COMMENT 'Last date to apply for resit',
  applied_at DATETIME DEFAULT NULL,
  fee_amount DECIMAL(10,2) DEFAULT NULL,
  class_track VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_result_student (result_id, student_ic),
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_ic VARCHAR(20) NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    target_audience ENUM('all', 'students', 'teachers', 'admin') DEFAULT 'all',
    start_date DATETIME,
    end_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_ic) REFERENCES users(ic) ON DELETE CASCADE
);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
















ALTER TABLE backup_logs
  ADD COLUMN file_checksum VARCHAR(128) NULL AFTER file_size,
  ADD COLUMN integrity_signature VARCHAR(128) NULL AFTER file_checksum;






CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    contact_method ENUM('email', 'whatsapp', 'both') DEFAULT 'email',
    status ENUM('pending', 'sent', 'read', 'replied', 'archived') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;















CREATE INDEX idx_attendance_document_confirmed ON attendance(document_confirmed);
CREATE INDEX idx_fees_document_confirmed ON fees(document_confirmed);








CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'Size in bytes',
    file_type VARCHAR(100) NOT NULL COMMENT 'MIME type',
    category ENUM('general', 'announcement', 'result', 'fee', 'event', 'class', 'other') DEFAULT 'general',
    tags JSON NULL COMMENT 'Array of tags',
    is_public BOOLEAN DEFAULT FALSE,
    access_level ENUM('public', 'students', 'teachers', 'admin', 'custom') DEFAULT 'public',
    allowed_roles JSON NULL COMMENT 'Array of allowed roles for custom access',
    uploaded_by VARCHAR(20) NOT NULL COMMENT 'IC of uploader',
    download_count INT DEFAULT 0,
    version INT DEFAULT 1,
    parent_document_id INT NULL COMMENT 'For versioning',
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(ic) ON DELETE RESTRICT,
    FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_public (is_public)
);




CREATE TABLE IF NOT EXISTS document_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    user_ic VARCHAR(20) DEFAULT NULL,
    action ENUM('view', 'download', 'upload', 'update', 'delete') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_document_id (document_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_created_at (created_at)
);








CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('religious', 'educational', 'social', 'charity', 'other') DEFAULT 'other',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    location VARCHAR(255),
    location_latitude DECIMAL(10, 8) NULL,
    location_longitude DECIMAL(11, 8) NULL,
    max_participants INT NULL,
    registration_required BOOLEAN DEFAULT FALSE,
    registration_deadline DATETIME NULL,
    fee DECIMAL(10, 2) DEFAULT 0,
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    image_url VARCHAR(500) NULL,
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_event_type (event_type)
);




CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_ic VARCHAR(20) DEFAULT NULL,
    status ENUM('registered', 'attended', 'cancelled', 'no_show') DEFAULT 'registered',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    payment_date DATETIME NULL,
    notes TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_ic),
    INDEX idx_event_id (event_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_status (status)
);








CREATE TABLE IF NOT EXISTS financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'online', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    receipt_image VARCHAR(500),
    related_type VARCHAR(50) NULL COMMENT 'Type of related entity (e.g., fee, event, donation)',
    related_id INT NULL COMMENT 'ID of related entity',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    approved_by VARCHAR(20) NULL COMMENT 'IC of approver',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_category (category),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status)
);




CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    budget_type ENUM('income', 'expense') NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    spent_amount DECIMAL(10, 2) DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_budget_type (budget_type),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end)
);










CREATE TABLE IF NOT EXISTS user_points (
    user_ic VARCHAR(20) PRIMARY KEY,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    points_to_next_level INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_total_points (total_points),
    INDEX idx_current_level (current_level)
);


CREATE TABLE IF NOT EXISTS user_streaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    streak_type ENUM('attendance', 'login', 'fee_payment', 'exam_taken') NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_user_streak (user_ic, streak_type),
    INDEX idx_user_streak (user_ic, streak_type),
    INDEX idx_streak_type (streak_type)
);


CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'trophy',
    category ENUM('attendance', 'academic', 'payment', 'social', 'milestone', 'special') NOT NULL,
    points_reward INT DEFAULT 0,
    requirement_type VARCHAR(50), 
    requirement_value INT,
    badge_color VARCHAR(20) DEFAULT 'gold',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);


CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_ic, achievement_id),
    INDEX idx_user_achievements (user_ic),
    INDEX idx_unlocked_at (unlocked_at)
);


CREATE TABLE IF NOT EXISTS points_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    source_type VARCHAR(50), 
    source_id INT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_points (user_ic),
    INDEX idx_created_at (created_at),
    INDEX idx_source (source_type, source_id)
);


CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    rank_position INT NOT NULL,
    total_points INT NOT NULL,
    current_level INT NOT NULL,
    category VARCHAR(50) DEFAULT 'overall', 
    period_start DATE,
    period_end DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_period (user_ic, category, period_start),
    INDEX idx_category_period (category, period_start, period_end),
    INDEX idx_rank (rank_position)
);


INSERT IGNORE INTO achievements (code, name, description, icon, category, points_reward, requirement_type, requirement_value, badge_color) VALUES

('first_attendance', 'Kemunculan Pertama', 'Hadir ke kelas untuk kali pertama', 'calendar-check', 'attendance', 10, 'attendance_count', 1, 'bronze'),
('perfect_week', 'Minggu Sempurna', 'Hadir setiap hari dalam seminggu', 'calendar-check', 'attendance', 50, 'attendance_streak', 7, 'silver'),
('perfect_month', 'Bulan Sempurna', 'Hadir setiap hari dalam sebulan', 'calendar-check', 'attendance', 200, 'attendance_streak', 30, 'gold'),
('attendance_10', '10 Hari Hadir', 'Mencapai 10 hari kehadiran', 'calendar-check', 'attendance', 30, 'attendance_count', 10, 'bronze'),
('attendance_50', '50 Hari Hadir', 'Mencapai 50 hari kehadiran', 'calendar-check', 'attendance', 150, 'attendance_count', 50, 'silver'),
('attendance_100', '100 Hari Hadir', 'Mencapai 100 hari kehadiran', 'calendar-check', 'attendance', 300, 'attendance_count', 100, 'gold'),
('streak_7', '7 Hari Berturut-turut', 'Streak kehadiran 7 hari', 'flame', 'attendance', 50, 'attendance_streak', 7, 'silver'),
('streak_30', '30 Hari Berturut-turut', 'Streak kehadiran 30 hari', 'flame', 'attendance', 200, 'attendance_streak', 30, 'gold'),
('streak_100', '100 Hari Berturut-turut', 'Streak kehadiran 100 hari - Luar Biasa!', 'flame', 'attendance', 500, 'attendance_streak', 100, 'platinum'),


('first_exam', 'Peperiksaan Pertama', 'Mengambil peperiksaan pertama', 'file-text', 'academic', 20, 'exam_count', 1, 'bronze'),
('top_score', 'Markah Tertinggi', 'Mendapat markah tertinggi dalam peperiksaan', 'award', 'academic', 100, 'exam_score', 95, 'gold'),
('perfect_score', 'Markah Sempurna', 'Mendapat 100 markah', 'star', 'academic', 150, 'exam_score', 100, 'platinum'),
('grade_a', 'Gred A', 'Mendapat gred A', 'medal', 'academic', 75, 'grade', 1, 'silver'),
('exam_10', '10 Peperiksaan', 'Mengambil 10 peperiksaan', 'file-text', 'academic', 100, 'exam_count', 10, 'silver'),


('first_payment', 'Bayaran Pertama', 'Membayar yuran untuk kali pertama', 'credit-card', 'payment', 25, 'payment_count', 1, 'bronze'),
('early_bird', 'Awal Bayar', 'Membayar yuran sebelum tarikh akhir', 'clock', 'payment', 50, 'early_payment', 1, 'silver'),
('perfect_payer', 'Pembayar Sempurna', 'Membayar semua yuran tepat pada masanya', 'credit-card', 'payment', 150, 'payment_streak', 6, 'gold'),


('level_5', 'Level 5', 'Mencapai Level 5', 'trending-up', 'milestone', 100, 'level', 5, 'silver'),
('level_10', 'Level 10', 'Mencapai Level 10', 'trending-up', 'milestone', 250, 'level', 10, 'gold'),
('level_20', 'Level 20', 'Mencapai Level 20 - Master!', 'trending-up', 'milestone', 500, 'level', 20, 'platinum'),
('points_1000', '1000 Mata', 'Mencapai 1000 mata', 'trophy', 'milestone', 200, 'points', 1000, 'gold'),
('points_5000', '5000 Mata', 'Mencapai 5000 mata', 'trophy', 'milestone', 500, 'points', 5000, 'platinum'),


('login_30', 'Pengguna Aktif', 'Log masuk 30 hari', 'log-in', 'social', 50, 'login_streak', 30, 'silver'),
('login_100', 'Pengguna Setia', 'Log masuk 100 hari', 'log-in', 'social', 150, 'login_streak', 100, 'gold'),


('new_year', 'Tahun Baharu', 'Aktif pada awal tahun baru', 'sparkles', 'special', 100, 'special_event', 1, 'gold'),
('ramadan', 'Ramadan Mubarak', 'Aktif semasa Ramadan', 'moon', 'special', 150, 'special_event', 1, 'platinum')
ON DUPLICATE KEY UPDATE name=VALUES(name);










ALTER TABLE users 
MODIFY COLUMN role ENUM('student','teacher','admin','pic','staff','ib') NOT NULL DEFAULT 'student';


CREATE TABLE IF NOT EXISTS payment_confirmations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bulan VARCHAR(20) NOT NULL, 
    tahun INT NOT NULL, 
    confirmed_by_ic VARCHAR(20) NOT NULL, 
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_period_start DATE NOT NULL, 
    confirmation_period_end DATE NOT NULL, 
    status ENUM('pending','confirmed','rejected') DEFAULT 'pending',
    notes TEXT, 
    total_payments INT DEFAULT 0, 
    total_amount DECIMAL(10,2) DEFAULT 0.00, 
    verified_payments INT DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (confirmed_by_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_month_year (bulan, tahun)
);


CREATE INDEX idx_payment_confirmation_period ON payment_confirmations(confirmation_period_start, confirmation_period_end);
CREATE INDEX idx_payment_confirmation_status ON payment_confirmations(status);









ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL COMMENT 'Last successful login timestamp';


CREATE INDEX IF NOT EXISTS idx_last_login ON users(last_login);


UPDATE users 
SET last_login = updated_at 
WHERE last_login IS NULL AND status = 'aktif' AND updated_at IS NOT NULL;








CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'announcement', 'reminder') DEFAULT 'info',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500) NULL COMMENT 'Optional link to related page',
    related_type VARCHAR(50) NULL COMMENT 'Type of related entity (e.g., fee, attendance, result)',
    related_id INT NULL COMMENT 'ID of related entity',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_ic (user_ic),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
);




CREATE TABLE IF NOT EXISTS notification_preferences (
    user_ic VARCHAR(20) PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    notify_on_fee_due BOOLEAN DEFAULT TRUE,
    notify_on_attendance BOOLEAN DEFAULT TRUE,
    notify_on_result BOOLEAN DEFAULT TRUE,
    notify_on_announcement BOOLEAN DEFAULT TRUE,
    notify_on_event BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);








CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_ic (user_ic),
    INDEX idx_expires_at (expires_at)
);









CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(50) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    credentials JSON,
    enabled_methods JSON,
    redirect_urls JSON,
    webhook_url VARCHAR(500),
    callback_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_gateway_name (gateway_name)
);


INSERT IGNORE INTO payment_gateway_settings (gateway_name, enabled, is_test_mode, credentials, enabled_methods, redirect_urls) VALUES
('stripe', FALSE, TRUE, 
 JSON_OBJECT('public_key', '', 'secret_key', '', 'webhook_secret', '', 'currency', 'MYR'),
 JSON_ARRAY('credit_card'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('ipay88', FALSE, TRUE,
 JSON_OBJECT('merchant_code', '', 'merchant_key', '', 'payment_url', 'https://payment.ipay88.com.my/epayment/entry.asp'),
 JSON_ARRAY('credit_card', 'fpx', 'ewallet'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('billplz', FALSE, TRUE,
 JSON_OBJECT('api_key', '', 'collection_id', '', 'x_signature_key', ''),
 JSON_ARRAY('fpx'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('toyyibpay', FALSE, TRUE,
 JSON_OBJECT('secret_key', '', 'category_code', '', 'callback_url', ''),
 JSON_ARRAY('fpx', 'credit_card'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('paypal', FALSE, TRUE,
 JSON_OBJECT('client_id', '', 'client_secret', '', 'mode', 'sandbox'),
 JSON_ARRAY('credit_card', 'paypal'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('qr_payment', FALSE, TRUE,
 JSON_OBJECT('qr_image_url', '', 'bank_name', '', 'account_number', '', 'account_holder_name', ''),
 JSON_ARRAY('qr_code'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('manual_bank_transfer', FALSE, TRUE,
 JSON_OBJECT('bank_name', '', 'account_number', '', 'account_holder_name', '', 'require_proof', TRUE),
 JSON_ARRAY('manual_transfer'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
)
ON DUPLICATE KEY UPDATE gateway_name = VALUES(gateway_name);









CREATE TABLE IF NOT EXISTS payment_method_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_code VARCHAR(50) UNIQUE NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    provider VARCHAR(50),
    display_order INT DEFAULT 0,
    icon VARCHAR(50),
    description TEXT,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_display_order (display_order)
);


INSERT IGNORE INTO payment_method_settings (method_code, method_name, enabled, provider, display_order, icon, description, config) VALUES
('fpx', 'FPX (Bank Transfer)', TRUE, 'ipay88', 1, 'CreditCard', 'Online banking transfer via FPX', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('duitnow_qr', 'DuitNow QR', TRUE, 'paynet_direct', 2, 'QrCode', 'Scan QR code to pay via DuitNow', JSON_OBJECT('providers', JSON_ARRAY('paynet_direct'))),
('duitnow_request', 'DuitNow Request', TRUE, 'paynet_direct', 3, 'Smartphone', 'Receive payment request on your phone', JSON_OBJECT('providers', JSON_ARRAY('paynet_direct'))),
('tng_ewallet', 'Touch\'n Go eWallet', TRUE, 'ipay88', 4, 'Wallet', 'Pay using Touch\'n Go eWallet', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('boost', 'Boost', TRUE, 'ipay88', 5, 'Wallet', 'Pay using Boost e-wallet', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('grabpay', 'GrabPay', TRUE, 'ipay88', 6, 'Wallet', 'Pay using GrabPay', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl')))
ON DUPLICATE KEY UPDATE method_name = VALUES(method_name);












CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    method ENUM('fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay') NOT NULL,
    provider ENUM('ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct') NOT NULL,
    provider_reference VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired') DEFAULT 'pending',
    proof_url VARCHAR(500),
    metadata JSON,
    idempotency_key VARCHAR(255) UNIQUE,
    webhook_received BOOLEAN DEFAULT FALSE,
    webhook_data JSON,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_ic (user_ic),
    INDEX idx_status (status),
    INDEX idx_provider_reference (provider_reference),
    INDEX idx_idempotency_key (idempotency_key),
    INDEX idx_created_at (created_at)
);




CREATE TABLE IF NOT EXISTS payment_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status_from VARCHAR(50),
    status_to VARCHAR(50),
    message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_created_at (created_at)
);




CREATE TABLE IF NOT EXISTS payment_reconciliation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    reconciliation_date DATE NOT NULL,
    provider_status VARCHAR(50),
    local_status VARCHAR(50),
    status_match BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status_match (status_match)
);




CREATE TABLE IF NOT EXISTS idempotency_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    payment_id VARCHAR(36),
    response_data JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key_hash (key_hash),
    INDEX idx_expires_at (expires_at)
);









ALTER TABLE users 
MODIFY COLUMN status ENUM('aktif','tidak_aktif','cuti','pending') DEFAULT 'pending';











CREATE TABLE IF NOT EXISTS report_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL COMMENT 'e.g., attendance, financial, student',
    template_config JSON NOT NULL COMMENT 'Report configuration',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_report_type (report_type)
);




CREATE TABLE IF NOT EXISTS generated_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    parameters JSON COMMENT 'Report parameters used',
    file_path VARCHAR(1000) COMMENT 'Path to generated file',
    file_format ENUM('pdf', 'excel', 'csv', 'json') DEFAULT 'pdf',
    file_size BIGINT,
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    generated_by VARCHAR(20) NOT NULL COMMENT 'IC of generator',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'When report expires',
    download_count INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_report_type (report_type),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at)
);








CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'image', 'link', 'json') DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('qr_code_image', NULL, 'image', 'QR Code image file path or URL for payment page'),
    ('qr_code_link', NULL, 'link', 'Alternative: QR Code link/URL for payment page'),
    ('qr_code_enabled', '1', 'text', 'Enable custom QR code (1=enabled, 0=disabled, uses auto-generated QR)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;








ALTER TABLE staff_checkin 
ADD COLUMN IF NOT EXISTS shift_type ENUM('normal', 'shift') DEFAULT 'normal' AFTER distance_from_masjid;


CREATE INDEX IF NOT EXISTS idx_shift_type ON staff_checkin(shift_type);









CREATE TABLE IF NOT EXISTS staff_checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_ic VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    check_in_latitude DECIMAL(10, 8) NULL,
    check_in_longitude DECIMAL(11, 8) NULL,
    check_out_latitude DECIMAL(10, 8) NULL,
    check_out_longitude DECIMAL(11, 8) NULL,
    status ENUM('checked_in', 'checked_out') DEFAULT 'checked_in',
    distance_from_masjid DECIMAL(10, 2) NULL COMMENT 'Distance in meters',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_staff_ic (staff_ic),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_status (status)
);



INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('masjid_latitude', '3.808236', 'text', 'Masjid latitude coordinate for geolocation check-in'),
    ('masjid_longitude', '103.328054', 'text', 'Masjid longitude coordinate for geolocation check-in'),
    ('masjid_checkin_radius', '100', 'text', 'Maximum allowed distance from masjid for check-in (in meters)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;








ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences JSON DEFAULT NULL 
AFTER status;
















CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    skills JSON NULL COMMENT 'Array of skills',
    availability JSON NULL COMMENT 'Availability schedule',
    interests JSON NULL COMMENT 'Array of interests',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    joined_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_volunteer (user_ic),
    INDEX idx_status (status)
);




CREATE TABLE IF NOT EXISTS volunteer_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_ic VARCHAR(20) NOT NULL,
    activity_type ENUM('event', 'maintenance', 'teaching', 'administrative', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    hours_worked DECIMAL(5, 2) DEFAULT 0,
    location VARCHAR(255),
    supervisor_ic VARCHAR(20) NULL COMMENT 'IC of supervisor',
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_volunteer_ic (volunteer_ic),
    INDEX idx_activity_date (activity_date),
    INDEX idx_status (status)
);




CREATE TABLE IF NOT EXISTS volunteer_recognitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_ic VARCHAR(20) NOT NULL,
    recognition_type ENUM('certificate', 'award', 'appreciation', 'badge') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recognition_date DATE NOT NULL,
    hours_threshold INT NULL COMMENT 'Hours required for recognition',
    certificate_url VARCHAR(500),
    awarded_by VARCHAR(20) NOT NULL COMMENT 'IC of person awarding',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_volunteer_ic (volunteer_ic),
    INDEX idx_recognition_date (recognition_date)
);














ALTER TABLE attendance 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'sent' 
COMMENT 'sent=awaiting approval, approved=finalized'
AFTER document_confirmed;


UPDATE attendance 
SET approval_status = CASE 
  WHEN document_confirmed = 1 THEN 'approved' 
  ELSE 'sent' 
END 
WHERE approval_status IS NULL OR approval_status = '';







CREATE TABLE IF NOT EXISTS campus_life_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  tarikh DATE,
  hari VARCHAR(20),
  masa VARCHAR(50),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_by_ic VARCHAR(20),
  reviewed_by_ic VARCHAR(20),
  reviewed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by_ic),
  INDEX idx_tarikh (tarikh)
);












SELECT 
    u.ic as 'Current IC',
    u.nama as 'Name',
    u.role as 'Role',
    u.telefon as 'Phone',
    LENGTH(REPLACE(u.ic, '-', '')) as 'IC Length',
    CASE 
        WHEN LENGTH(REPLACE(u.ic, '-', '')) != 12 THEN 'Wrong Length'
        WHEN NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$') THEN 'Invalid Characters'
        ELSE 'Valid'
    END as 'Issue',
    s.kelas_id as 'Class ID',
    c.nama_kelas as 'Class Name'
FROM users u
LEFT JOIN students s ON u.ic = s.user_ic
LEFT JOIN classes c ON s.kelas_id = c.id
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
ORDER BY u.role, u.nama;


SELECT 
    u.role as 'Role',
    COUNT(*) as 'Count of Invalid ICs'
FROM users u
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
GROUP BY u.role;


SELECT 
    'Problematic ICs' as 'Section',
    GROUP_CONCAT(DISTINCT ic ORDER BY ic SEPARATOR ', ') as 'Invalid IC List'
FROM users
WHERE LENGTH(REPLACE(ic, '-', '')) != 12
   OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$');











CREATE TABLE IF NOT EXISTS class_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20) NOT NULL COMMENT 'Student user_ic',
    class_id INT NOT NULL,
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'permanent'
        CHECK (assignment_type IN ('permanent','exam')),
    exam_session_id INT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ca_student (student_ic),
    INDEX idx_ca_class (class_id),
    INDEX idx_ca_active (is_active),
    INDEX idx_ca_dates (start_date, end_date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student-class assignments: permanent + temporary exam';


CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_es_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_ic VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_al_admin (admin_ic),
    INDEX idx_al_created (created_at),
    INDEX idx_al_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_perm (role, permission_code),
    INDEX idx_rp_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO permissions (code, description) VALUES
('class.view', 'View class list'),
('class.change', 'Change student class'),
('class.exam.assign', 'Assign exam class'),
('class.rollback', 'Undo class change');


INSERT IGNORE INTO role_permissions (role, permission_code)
SELECT 'admin', code FROM permissions WHERE code LIKE 'class.%';
INSERT IGNORE INTO role_permissions (role, permission_code)
SELECT 'staff', code FROM permissions WHERE code LIKE 'class.%';
INSERT IGNORE INTO role_permissions (role, permission_code)
VALUES ('teacher', 'class.view');
















CREATE TABLE IF NOT EXISTS class_change_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_ic VARCHAR(20) NOT NULL COMMENT 'IC of admin who made the change',
  student_ic VARCHAR(20) NOT NULL COMMENT 'Student IC',
  from_class_id INT NULL COMMENT 'Previous class ID',
  to_class_id INT NOT NULL COMMENT 'New class ID',
  assignment_type ENUM('permanent', 'exam') NOT NULL DEFAULT 'permanent',
  end_date DATE NULL COMMENT 'For exam: when assignment ends',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_class_change_student (student_ic),
  INDEX idx_class_change_created (created_at),
  INDEX idx_class_change_admin (admin_ic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for student class changes';







CREATE TABLE IF NOT EXISTS archived_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    nama VARCHAR(100) NOT NULL,
    umur INT,
    alamat VARCHAR(255),
    telefon VARCHAR(20),
    email VARCHAR(100),
    kelas_id INT,
    tarikh_daftar DATE,
    tarikh_arkib DATE DEFAULT CURRENT_TIMESTAMP,
    alasan_arkib VARCHAR(500),
    archived_by VARCHAR(20),
    original_data JSON, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_ic (user_ic),
    INDEX idx_tarikh_arkib (tarikh_arkib),
    FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;











SET @ib_ic = '731014065251';
SET @ib_nama = 'IB Master Admin';
SET @ib_email = 'ib@masjid.app'; 
SET @ib_password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K5XvJ5K5K5K5'; 


SET @user_exists = (SELECT COUNT(*) FROM users WHERE ic = @ib_ic OR REPLACE(ic, '-', '') = @ib_ic);



INSERT IGNORE INTO users (ic, nama, email, password, role, status, created_at, updated_at)
VALUES (
    @ib_ic,
    @ib_nama,
    @ib_email,
    @ib_password, 
    'ib',
    'aktif',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE 
    nama = COALESCE(@ib_nama, nama),
    email = COALESCE(@ib_email, email),
    role = 'ib',
    status = 'aktif',
    updated_at = CURRENT_TIMESTAMP;


SELECT 
    ic,
    nama,
    email,
    role,
    status,
    'User created successfully. Password needs to be set via admin panel.' as note
FROM users 
WHERE ic = @ib_ic;










CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_ic VARCHAR(20) DEFAULT NULL,
  role ENUM('admin', 'teacher', 'student', 'pic', 'staff', 'ib') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_ic, role),
  FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);










CREATE TABLE IF NOT EXISTS staff_checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_ic VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    check_in_latitude DECIMAL(10, 8) NULL,
    check_in_longitude DECIMAL(11, 8) NULL,
    check_out_latitude DECIMAL(10, 8) NULL,
    check_out_longitude DECIMAL(11, 8) NULL,
    status ENUM('checked_in', 'checked_out') DEFAULT 'checked_in',
    distance_from_masjid DECIMAL(10, 2) NULL COMMENT 'Distance in meters',
    shift_type ENUM('normal', 'shift') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_staff_ic (staff_ic),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_status (status),
    INDEX idx_shift_type (shift_type)
);


SET @dbname = DATABASE();
SET @tablename = 'staff_checkin';
SET @columnname = 'shift_type';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'normal\', \'shift\') DEFAULT \'normal\' AFTER distance_from_masjid')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('masjid_latitude', '3.808236', 'text', 'Masjid latitude coordinate for geolocation check-in'),
    ('masjid_longitude', '103.328054', 'text', 'Masjid longitude coordinate for geolocation check-in'),
    ('masjid_checkin_radius', '100', 'text', 'Maximum allowed distance from masjid for check-in (in meters)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;















DROP TEMPORARY TABLE IF EXISTS ic_mappings;
CREATE TEMPORARY TABLE ic_mappings (
    old_ic VARCHAR(20) PRIMARY KEY,
    new_ic VARCHAR(20),
    new_ic_formatted VARCHAR(20)
);









INSERT IGNORE INTO ic_mappings (old_ic)
SELECT DISTINCT u.ic
FROM users u
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
ORDER BY u.ic;




SET @base_prefix = CONCAT('99', DATE_FORMAT(NOW(), '%y%m'));
SET @start_counter = COALESCE((
    SELECT MAX(CAST(SUBSTRING(REPLACE(ic, '-', ''), 7) AS UNSIGNED))
    FROM users 
    WHERE REPLACE(ic, '-', '') LIKE CONCAT(@base_prefix, '%')
      AND LENGTH(REPLACE(ic, '-', '')) = 12
), 0);


DROP TEMPORARY TABLE IF EXISTS ic_mappings_ranked;
CREATE TEMPORARY TABLE ic_mappings_ranked (
    old_ic VARCHAR(20) PRIMARY KEY,
    row_num INT
);

SET @row_num = 0;

INSERT IGNORE INTO ic_mappings_ranked (old_ic, row_num)
SELECT old_ic, @row_num := @row_num + 1 as row_num
FROM ic_mappings
ORDER BY old_ic;


UPDATE ic_mappings m
JOIN ic_mappings_ranked r ON m.old_ic = r.old_ic
SET m.new_ic = CONCAT(@base_prefix, LPAD(CAST((r.row_num + @start_counter) AS UNSIGNED), 6, '0'));



UPDATE ic_mappings
SET new_ic_formatted = CONCAT(
    SUBSTRING(new_ic, 1, 6),
    '-',
    SUBSTRING(new_ic, 7, 2),
    '-',
    SUBSTRING(new_ic, 9, 4)
)
WHERE LENGTH(new_ic) = 12 
  AND new_ic REGEXP '^[0-9]{12}$'
  AND (new_ic_formatted IS NULL OR new_ic_formatted NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$');

DROP TEMPORARY TABLE ic_mappings_ranked;




SELECT 
    m.old_ic as 'Old IC',
    m.new_ic_formatted as 'New IC',
    u.nama as 'Name',
    u.role as 'Role'
FROM ic_mappings m
JOIN users u ON u.ic = m.old_ic
ORDER BY u.role, u.nama;






SET FOREIGN_KEY_CHECKS = 0;


UPDATE students s
JOIN ic_mappings m ON s.user_ic = m.old_ic
SET s.user_ic = m.new_ic_formatted;


UPDATE teachers t
JOIN ic_mappings m ON t.user_ic = m.old_ic
SET t.user_ic = m.new_ic_formatted;


UPDATE classes c
JOIN ic_mappings m ON c.guru_ic = m.old_ic
SET c.guru_ic = m.new_ic_formatted;


UPDATE attendance a
JOIN ic_mappings m ON a.student_ic = m.old_ic
SET a.student_ic = m.new_ic_formatted;

UPDATE attendance a
JOIN ic_mappings m ON a.marked_by = m.old_ic
SET a.marked_by = m.new_ic_formatted;


UPDATE results r
JOIN ic_mappings m ON r.student_ic = m.old_ic
SET r.student_ic = m.new_ic_formatted;


UPDATE fees f
JOIN ic_mappings m ON f.student_ic = m.old_ic
SET f.student_ic = m.new_ic_formatted;


UPDATE user_roles ur
JOIN ic_mappings m ON ur.user_ic = m.old_ic
SET ur.user_ic = m.new_ic_formatted;


UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.created_by = m.old_ic
SET ppc.created_by = m.new_ic_formatted;

UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.approved_by = m.old_ic
SET ppc.approved_by = m.new_ic_formatted;


UPDATE admin_action_snapshots aas
JOIN ic_mappings m ON aas.created_by = m.old_ic
SET aas.created_by = m.new_ic_formatted;


UPDATE announcements a
JOIN ic_mappings m ON a.author_ic = m.old_ic
SET a.author_ic = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'announcements' AND column_name = 'author_ic');


SET @payments_table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payments');
SET @payments_student_ic_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'student_ic');
SET @payments_created_by_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'created_by');












INSERT IGNORE INTO users (ic, nama, umur, alamat, telefon, email, password, role, status, created_at, updated_at)
SELECT 
    m.new_ic_formatted as ic,
    u.nama,
    u.umur,
    u.alamat,
    u.telefon,
    u.email,
    u.password,
    u.role,
    u.status,
    u.created_at,
    NOW() as updated_at
FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;



DELETE u FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;


SET FOREIGN_KEY_CHECKS = 1;




SELECT 
    'Summary' as 'Section',
    COUNT(*) as 'Total Users Fixed',
    COUNT(CASE WHEN role = 'student' THEN 1 END) as 'Students Fixed',
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as 'Teachers Fixed',
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as 'Admins Fixed'
FROM ic_mappings m
JOIN users u ON u.ic = m.new_ic_formatted;


SELECT 
    'Validation' as 'Section',
    COUNT(*) as 'Users with Invalid IC Format',
    GROUP_CONCAT(ic SEPARATOR ', ') as 'Invalid ICs'
FROM users
WHERE LENGTH(REPLACE(ic, '-', '')) != 12
   OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$');


DROP TEMPORARY TABLE ic_mappings;























DROP TEMPORARY TABLE IF EXISTS ic_mappings;
CREATE TEMPORARY TABLE ic_mappings (
    row_num INT AUTO_INCREMENT PRIMARY KEY,
    old_ic VARCHAR(20),
    new_ic VARCHAR(20),
    new_ic_formatted VARCHAR(20),
    UNIQUE KEY (old_ic)
);





INSERT IGNORE INTO ic_mappings (old_ic)
SELECT u.ic
FROM users u
WHERE LENGTH(REPLACE(u.ic, '-', '')) != 12
   OR NOT (REPLACE(u.ic, '-', '') REGEXP '^[0-9]{12}$')
ORDER BY u.ic;



SET @base_prefix = CONCAT('99', DATE_FORMAT(NOW(), '%y%m'));
SET @start_counter = COALESCE((
    SELECT MAX(CAST(SUBSTRING(REPLACE(ic, '-', ''), 7) AS UNSIGNED))
    FROM users 
    WHERE REPLACE(ic, '-', '') LIKE CONCAT(@base_prefix, '%')
      AND LENGTH(REPLACE(ic, '-', '')) = 12
), 0);


UPDATE ic_mappings
SET 
    new_ic = CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')),
    new_ic_formatted = CONCAT(
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 1, 6),
        '-',
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 7, 2),
        '-',
        SUBSTRING(CONCAT(@base_prefix, LPAD(row_num + @start_counter, 6, '0')), 9, 4)
    );




SELECT 
    m.old_ic as 'Old IC',
    m.new_ic_formatted as 'New IC',
    u.nama as 'Name',
    u.role as 'Role'
FROM ic_mappings m
JOIN users u ON u.ic = m.old_ic
ORDER BY u.role, u.nama;






SET FOREIGN_KEY_CHECKS = 0;


UPDATE students s
JOIN ic_mappings m ON s.user_ic = m.old_ic
SET s.user_ic = m.new_ic_formatted;


UPDATE teachers t
JOIN ic_mappings m ON t.user_ic = m.old_ic
SET t.user_ic = m.new_ic_formatted;


UPDATE classes c
JOIN ic_mappings m ON c.guru_ic = m.old_ic
SET c.guru_ic = m.new_ic_formatted;


UPDATE attendance a
JOIN ic_mappings m ON a.student_ic = m.old_ic
SET a.student_ic = m.new_ic_formatted;

UPDATE attendance a
JOIN ic_mappings m ON a.marked_by = m.old_ic
SET a.marked_by = m.new_ic_formatted;


UPDATE results r
JOIN ic_mappings m ON r.student_ic = m.old_ic
SET r.student_ic = m.new_ic_formatted;


UPDATE fees f
JOIN ic_mappings m ON f.student_ic = m.old_ic
SET f.student_ic = m.new_ic_formatted;


UPDATE user_roles ur
JOIN ic_mappings m ON ur.user_ic = m.old_ic
SET ur.user_ic = m.new_ic_formatted;


UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.created_by = m.old_ic
SET ppc.created_by = m.new_ic_formatted;

UPDATE pending_pic_changes ppc
JOIN ic_mappings m ON ppc.approved_by = m.old_ic
SET ppc.approved_by = m.new_ic_formatted;


UPDATE admin_action_snapshots aas
JOIN ic_mappings m ON aas.actor_ic = m.old_ic
SET aas.actor_ic = m.new_ic_formatted;


UPDATE announcements a
JOIN ic_mappings m ON a.author_ic = m.old_ic
SET a.author_ic = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'announcements' 
              AND column_name = 'author_ic');


UPDATE payments p
JOIN ic_mappings m ON p.student_ic = m.old_ic
SET p.student_ic = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'payments' 
              AND column_name = 'student_ic');

UPDATE payments p
JOIN ic_mappings m ON p.created_by = m.old_ic
SET p.created_by = m.new_ic_formatted
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = DATABASE()
              AND table_name = 'payments' 
              AND column_name = 'created_by');





INSERT IGNORE INTO users (ic, nama, umur, alamat, telefon, email, password, role, status, created_at, updated_at)
SELECT 
    m.new_ic_formatted as ic,
    u.nama,
    u.umur,
    u.alamat,
    u.telefon,
    u.email,
    u.password,
    u.role,
    u.status,
    u.created_at,
    NOW() as updated_at
FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;


DELETE u FROM users u
JOIN ic_mappings m ON u.ic = m.old_ic;


SET FOREIGN_KEY_CHECKS = 1;




SELECT 
    'Summary' as 'Section',
    COUNT(*) as 'Total Users Fixed'
FROM ic_mappings;


SELECT 
    'Validation' as 'Section',
    COUNT(*) as 'Users with Invalid IC Format',
    GROUP_CONCAT(ic SEPARATOR ', ') as 'Invalid ICs'
FROM users
WHERE LENGTH(REPLACE(ic, '-', '')) != 12
   OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$');


DROP TEMPORARY TABLE ic_mappings;

















ALTER TABLE students MODIFY COLUMN kelas_id INT NULL COMMENT 'Class reference';













SET FOREIGN_KEY_CHECKS = 0;





UPDATE users SET ic = '660322-06-5653' WHERE nama = 'ZANAL ABIDIN BIN ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '691222-06-5287' WHERE nama = 'MOHAMMAD WAZAR BIN MOHD DAWI' AND role = 'teacher';
UPDATE users SET ic = '701108-06-5175' WHERE nama = 'MOHD NOOR BIN DIN' AND role = 'teacher';
UPDATE users SET ic = '710515-06-5193' WHERE nama = 'A. ZUNNOR BIN ABD RAHMAN' AND role = 'teacher';
UPDATE users SET ic = '720301-06-5533' WHERE nama = 'RUSDAN BIN ABDUL JALIL' AND role = 'teacher';
UPDATE users SET ic = '720323-06-5059' WHERE nama = 'SHAIFUDDIN BIN NGAH' AND role = 'teacher';
UPDATE users SET ic = '731014-06-5251' WHERE nama = 'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH' AND role = 'teacher';
UPDATE users SET ic = '740101-06-5000' WHERE nama = 'KHAIRUL AZZURA BINTI ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '770704-06-5541' WHERE nama = 'AHMAD SHARIZAL BIN SAFFRIM' AND role = 'teacher';
UPDATE users SET ic = '811026-06-5435' WHERE nama = 'MOHD HASBULLAH BIN ABDULLAH @ ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '840714-02-5376' WHERE nama = 'NABIJAH BINTI ZAKARIA' AND role = 'teacher';
UPDATE users SET ic = '870526-06-5845' WHERE nama = 'SYED FIRMAN SYAMIL BIN SYED AFFENDY' AND role = 'teacher';
UPDATE users SET ic = '891003-06-5929' WHERE nama = 'WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN' AND role = 'teacher';
UPDATE users SET ic = '900102-06-6005' WHERE nama = 'MOHAMAD IZWANUDDIN BIN MOHD DAHALAN' AND role = 'teacher';
UPDATE users SET ic = '911115-06-5216' WHERE nama = 'NURUL SYAZWANI AISYAH BINTI RUSLI' AND role = 'teacher';
UPDATE users SET ic = '911210-06-5097' WHERE nama = 'MUHAMMAD IHSAN BIN MHD ZAHARI' AND role = 'teacher';
UPDATE users SET ic = '920312-06-5113' WHERE nama = 'AMIR HASIF BIN HATA' AND role = 'teacher';
UPDATE users SET ic = '921125-06-5606' WHERE nama = 'PUTRI ANATI BINTI AZAHAR' AND role = 'teacher';
UPDATE users SET ic = '930929-06-5390' WHERE nama = 'SYAHIRAH AISYAH BINTI SUFIAN' AND role = 'teacher';
UPDATE users SET ic = '931129-06-5047' WHERE nama = 'AHMAD HAYATUL FAIZ BIN ABD LATIF' AND role = 'teacher';
UPDATE users SET ic = '941218-07-5641' WHERE nama = 'MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI' AND role = 'teacher';
UPDATE users SET ic = '950717-06-5661' WHERE nama = 'MUHAMMAD \'IZZAN BIN IDRIS' AND role = 'teacher';
UPDATE users SET ic = '951209-06-5192' WHERE nama = 'NURAIN NASUHA BINTI MOHD YUSOFF' AND role = 'teacher';
UPDATE users SET ic = '951220-06-5759' WHERE nama = 'MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ' AND role = 'teacher';
UPDATE users SET ic = '960505-06-5909' WHERE nama = 'MUHAMMAD HAFIZUDDIN BIN TAJUDDIN' AND role = 'teacher';
UPDATE users SET ic = '990124-06-5179' WHERE nama = 'MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI' AND role = 'teacher';
UPDATE users SET ic = '991002-01-6189' WHERE nama = 'MOHAMAD SADIQ UMAIR BIN NAHAR' AND role = 'teacher';


UPDATE classes SET guru_ic = '660322-06-5653' WHERE guru_ic IN ('603220-60-5653', '6603220605653');
UPDATE classes SET guru_ic = '691222-06-5287' WHERE guru_ic IN ('912220-60-5287', '6912220605287');
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic IN ('011080-60-5175', '7011080605175');
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic IN ('105150-60-5193', '7105150605193');
UPDATE classes SET guru_ic = '720301-06-5533' WHERE guru_ic IN ('203010-60-5533', '7203010605533');
UPDATE classes SET guru_ic = '720323-06-5059' WHERE guru_ic IN ('203230-60-5059', '7203230605059');
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic IN ('310140-60-5251', '7310140605251');
UPDATE classes SET guru_ic = '740101-06-5000' WHERE guru_ic IN ('401010-60-5000', '7401010605000');
UPDATE classes SET guru_ic = '770704-06-5541' WHERE guru_ic IN ('707040-60-5541', '7707040605541');
UPDATE classes SET guru_ic = '811026-06-5435' WHERE guru_ic IN ('110260-60-5435', '8110260605435');
UPDATE classes SET guru_ic = '840714-02-5376' WHERE guru_ic IN ('407140-20-5376', '8407140205376');
UPDATE classes SET guru_ic = '870526-06-5845' WHERE guru_ic IN ('705260-60-5845', '8705260605845');
UPDATE classes SET guru_ic = '891003-06-5929' WHERE guru_ic IN ('910030-60-5929', '8910030605929');
UPDATE classes SET guru_ic = '900102-06-6005' WHERE guru_ic IN ('001020-60-6005', '9001020606005');
UPDATE classes SET guru_ic = '911115-06-5216' WHERE guru_ic IN ('111150-60-5216', '9111150605216');
UPDATE classes SET guru_ic = '911210-06-5097' WHERE guru_ic IN ('112100-60-5097', '9112100605097');
UPDATE classes SET guru_ic = '920312-06-5113' WHERE guru_ic IN ('203120-60-5113', '9203120605113');
UPDATE classes SET guru_ic = '921125-06-5606' WHERE guru_ic IN ('211250-60-5606', '9211250605606');
UPDATE classes SET guru_ic = '930929-06-5390' WHERE guru_ic IN ('309290-60-5390', '9309290605390');
UPDATE classes SET guru_ic = '931129-06-5047' WHERE guru_ic IN ('311290-60-5047', '9311290605047');
UPDATE classes SET guru_ic = '941218-07-5641' WHERE guru_ic IN ('412180-70-5641', '9412180705641');
UPDATE classes SET guru_ic = '950717-06-5661' WHERE guru_ic IN ('507170-60-5661', '9507170605661');
UPDATE classes SET guru_ic = '951209-06-5192' WHERE guru_ic IN ('512090-60-5192', '9512090605192');
UPDATE classes SET guru_ic = '951220-06-5759' WHERE guru_ic IN ('512200-60-5759', '9512200605759');
UPDATE classes SET guru_ic = '960505-06-5909' WHERE guru_ic IN ('605050-60-5909', '9605050605909');
UPDATE classes SET guru_ic = '990124-06-5179' WHERE guru_ic IN ('901240-60-5179', '9901240605179');
UPDATE classes SET guru_ic = '991002-01-6189' WHERE guru_ic IN ('910020-10-6189', '9910020106189');


UPDATE teachers SET user_ic = '660322-06-5653' WHERE user_ic IN ('603220-60-5653', '6603220605653');
UPDATE teachers SET user_ic = '691222-06-5287' WHERE user_ic IN ('912220-60-5287', '6912220605287');
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic IN ('011080-60-5175', '7011080605175');
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic IN ('105150-60-5193', '7105150605193');
UPDATE teachers SET user_ic = '720301-06-5533' WHERE user_ic IN ('203010-60-5533', '7203010605533');
UPDATE teachers SET user_ic = '720323-06-5059' WHERE user_ic IN ('203230-60-5059', '7203230605059');
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic IN ('310140-60-5251', '7310140605251');
UPDATE teachers SET user_ic = '740101-06-5000' WHERE user_ic IN ('401010-60-5000', '7401010605000');
UPDATE teachers SET user_ic = '770704-06-5541' WHERE user_ic IN ('707040-60-5541', '7707040605541');
UPDATE teachers SET user_ic = '811026-06-5435' WHERE user_ic IN ('110260-60-5435', '8110260605435');
UPDATE teachers SET user_ic = '840714-02-5376' WHERE user_ic IN ('407140-20-5376', '8407140205376');
UPDATE teachers SET user_ic = '870526-06-5845' WHERE user_ic IN ('705260-60-5845', '8705260605845');
UPDATE teachers SET user_ic = '891003-06-5929' WHERE user_ic IN ('910030-60-5929', '8910030605929');
UPDATE teachers SET user_ic = '900102-06-6005' WHERE user_ic IN ('001020-60-6005', '9001020606005');
UPDATE teachers SET user_ic = '911115-06-5216' WHERE user_ic IN ('111150-60-5216', '9111150605216');
UPDATE teachers SET user_ic = '911210-06-5097' WHERE user_ic IN ('112100-60-5097', '9112100605097');
UPDATE teachers SET user_ic = '920312-06-5113' WHERE user_ic IN ('203120-60-5113', '9203120605113');
UPDATE teachers SET user_ic = '921125-06-5606' WHERE user_ic IN ('211250-60-5606', '9211250605606');
UPDATE teachers SET user_ic = '930929-06-5390' WHERE user_ic IN ('309290-60-5390', '9309290605390');
UPDATE teachers SET user_ic = '931129-06-5047' WHERE user_ic IN ('311290-60-5047', '9311290605047');
UPDATE teachers SET user_ic = '941218-07-5641' WHERE user_ic IN ('412180-70-5641', '9412180705641');
UPDATE teachers SET user_ic = '950717-06-5661' WHERE user_ic IN ('507170-60-5661', '9507170605661');
UPDATE teachers SET user_ic = '951209-06-5192' WHERE user_ic IN ('512090-60-5192', '9512090605192');
UPDATE teachers SET user_ic = '951220-06-5759' WHERE user_ic IN ('512200-60-5759', '9512200605759');
UPDATE teachers SET user_ic = '960505-06-5909' WHERE user_ic IN ('605050-60-5909', '9605050605909');
UPDATE teachers SET user_ic = '990124-06-5179' WHERE user_ic IN ('901240-60-5179', '9901240605179');
UPDATE teachers SET user_ic = '991002-01-6189' WHERE user_ic IN ('910020-10-6189', '9910020106189');

SET FOREIGN_KEY_CHECKS = 1;


SELECT 
    ic,
    nama,
    LENGTH(REPLACE(ic, '-', '')) as digit_count,
    CASE 
        WHEN ic LIKE '%-%-%' AND LENGTH(REPLACE(ic, '-', '')) = 12 THEN '✅ Correct'
        WHEN ic LIKE 'T%' THEN '⚠️ Placeholder'
        ELSE '❌ Needs Fix'
    END as status
FROM users 
WHERE role = 'teacher' 
  AND nama IN (
    'ZANAL ABIDIN BIN ISMAIL',
    'MOHD NOOR BIN DIN',
    'A. ZUNNOR BIN ABD RAHMAN',
    'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH',
    'MOHAMMAD WAZAR BIN MOHD DAWI',
    'AHMAD HAYATUL FAIZ BIN ABD LATIF'
  )
ORDER BY nama;













SET FOREIGN_KEY_CHECKS = 0;





UPDATE users SET ic = CONCAT(
    SUBSTRING(REPLACE(ic, '-', ''), -12, 6), '-',
    SUBSTRING(REPLACE(ic, '-', ''), -6, 2), '-',
    SUBSTRING(REPLACE(ic, '-', ''), -4, 4)
) WHERE role = 'teacher' 
  AND LENGTH(REPLACE(ic, '-', '')) = 13
  AND ic NOT LIKE 'T%'
  AND ic NOT LIKE '123456%';




UPDATE users SET ic = CONCAT(
    SUBSTRING(REPLACE(ic, '-', ''), 1, 6), '-',
    SUBSTRING(REPLACE(ic, '-', ''), 7, 2), '-',
    SUBSTRING(REPLACE(ic, '-', ''), 9, 4)
) WHERE role = 'teacher' 
  AND LENGTH(REPLACE(ic, '-', '')) = 12
  AND ic NOT LIKE '%-%-%'
  AND ic NOT LIKE 'T%'
  AND ic NOT LIKE '123456%';




UPDATE classes SET guru_ic = '660322-06-5653' WHERE guru_ic = '6603220605653';
UPDATE classes SET guru_ic = '691222-06-5287' WHERE guru_ic = '6912220605287';
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic = '7011080605175';
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic = '7105150605193';
UPDATE classes SET guru_ic = '720301-06-5533' WHERE guru_ic = '7203010605533';
UPDATE classes SET guru_ic = '720323-06-5059' WHERE guru_ic = '7203230605059';
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic = '7310140605251';
UPDATE classes SET guru_ic = '740101-06-5000' WHERE guru_ic = '7401010605000';
UPDATE classes SET guru_ic = '770704-06-5541' WHERE guru_ic = '7707040605541';
UPDATE classes SET guru_ic = '811026-06-5435' WHERE guru_ic = '8110260605435';
UPDATE classes SET guru_ic = '840714-02-5376' WHERE guru_ic = '8407140205376';
UPDATE classes SET guru_ic = '870526-06-5845' WHERE guru_ic = '8705260605845';
UPDATE classes SET guru_ic = '891003-06-5929' WHERE guru_ic = '8910030605929';
UPDATE classes SET guru_ic = '900102-06-6005' WHERE guru_ic = '9001020606005';
UPDATE classes SET guru_ic = '911115-06-5216' WHERE guru_ic = '9111150605216';
UPDATE classes SET guru_ic = '911210-06-5097' WHERE guru_ic = '9112100605097';
UPDATE classes SET guru_ic = '920312-06-5113' WHERE guru_ic = '9203120605113';
UPDATE classes SET guru_ic = '921125-06-5606' WHERE guru_ic = '9211250605606';
UPDATE classes SET guru_ic = '930929-06-5390' WHERE guru_ic = '9309290605390';
UPDATE classes SET guru_ic = '931129-06-5047' WHERE guru_ic = '9311290605047';
UPDATE classes SET guru_ic = '941218-07-5641' WHERE guru_ic = '9412180705641';
UPDATE classes SET guru_ic = '950717-06-5661' WHERE guru_ic = '9507170605661';
UPDATE classes SET guru_ic = '951209-06-5192' WHERE guru_ic = '9512090605192';
UPDATE classes SET guru_ic = '951220-06-5759' WHERE guru_ic = '9512200605759';
UPDATE classes SET guru_ic = '960505-06-5909' WHERE guru_ic = '9605050605909';
UPDATE classes SET guru_ic = '990124-06-5179' WHERE guru_ic = '9901240605179';
UPDATE classes SET guru_ic = '991002-01-6189' WHERE guru_ic = '9910020106189';




UPDATE teachers SET user_ic = '660322-06-5653' WHERE user_ic = '6603220605653';
UPDATE teachers SET user_ic = '691222-06-5287' WHERE user_ic = '6912220605287';
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic = '7011080605175';
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic = '7105150605193';
UPDATE teachers SET user_ic = '720301-06-5533' WHERE user_ic = '7203010605533';
UPDATE teachers SET user_ic = '720323-06-5059' WHERE user_ic = '7203230605059';
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic = '7310140605251';
UPDATE teachers SET user_ic = '740101-06-5000' WHERE user_ic = '7401010605000';
UPDATE teachers SET user_ic = '770704-06-5541' WHERE user_ic = '7707040605541';
UPDATE teachers SET user_ic = '811026-06-5435' WHERE user_ic = '8110260605435';
UPDATE teachers SET user_ic = '840714-02-5376' WHERE user_ic = '8407140205376';
UPDATE teachers SET user_ic = '870526-06-5845' WHERE user_ic = '8705260605845';
UPDATE teachers SET user_ic = '891003-06-5929' WHERE user_ic = '8910030605929';
UPDATE teachers SET user_ic = '900102-06-6005' WHERE user_ic = '9001020606005';
UPDATE teachers SET user_ic = '911115-06-5216' WHERE user_ic = '9111150605216';
UPDATE teachers SET user_ic = '911210-06-5097' WHERE user_ic = '9112100605097';
UPDATE teachers SET user_ic = '920312-06-5113' WHERE user_ic = '9203120605113';
UPDATE teachers SET user_ic = '921125-06-5606' WHERE user_ic = '9211250605606';
UPDATE teachers SET user_ic = '930929-06-5390' WHERE user_ic = '9309290605390';
UPDATE teachers SET user_ic = '931129-06-5047' WHERE user_ic = '9311290605047';
UPDATE teachers SET user_ic = '941218-07-5641' WHERE user_ic = '9412180705641';
UPDATE teachers SET user_ic = '950717-06-5661' WHERE user_ic = '9507170605661';
UPDATE teachers SET user_ic = '951209-06-5192' WHERE user_ic = '9512090605192';
UPDATE teachers SET user_ic = '951220-06-5759' WHERE user_ic = '9512200605759';
UPDATE teachers SET user_ic = '960505-06-5909' WHERE user_ic = '9605050605909';
UPDATE teachers SET user_ic = '990124-06-5179' WHERE user_ic = '9901240605179';
UPDATE teachers SET user_ic = '991002-01-6189' WHERE user_ic = '9910020106189';


SET FOREIGN_KEY_CHECKS = 1;




SELECT 
    ic,
    nama,
    LENGTH(REPLACE(ic, '-', '')) as digit_count,
    CASE 
        WHEN ic LIKE '%-%-%' AND LENGTH(REPLACE(ic, '-', '')) = 12 THEN '✅ Correct'
        WHEN ic LIKE 'T%' THEN '⚠️ Placeholder'
        ELSE '❌ Needs Fix'
    END as status
FROM users 
WHERE role = 'teacher' 
ORDER BY 
    CASE WHEN ic LIKE 'T%' THEN 1 ELSE 0 END,
    ic;







CREATE TABLE IF NOT EXISTS ib_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(60) NOT NULL,
    user_ic VARCHAR(20) DEFAULT NULL,
    bulan VARCHAR(20),
    tahun INT,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    document_type ENUM('fee','attendance','monthly','general') DEFAULT 'general',
    amount DECIMAL(12,2) DEFAULT NULL,
    notes TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_ib_action_logs_user_ic (user_ic),
    INDEX idx_ib_action_logs_month_year (bulan, tahun)
);

CREATE TABLE IF NOT EXISTS ib_document_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_type ENUM('fee','attendance') NOT NULL,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    flagged_by_ic VARCHAR(20) DEFAULT NULL,
    needs_clarification TINYINT(1) NOT NULL DEFAULT 1,
    send_back_to_pic TINYINT(1) NOT NULL DEFAULT 0,
    reason TEXT,
    notes TEXT,
    resolved TINYINT(1) NOT NULL DEFAULT 0,
    resolved_by_ic VARCHAR(20),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flagged_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_ib_document_flags_payment (payment_id),
    INDEX idx_ib_document_flags_attendance (attendance_id)
);







CREATE TABLE IF NOT EXISTS ib_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(60) NOT NULL,
    user_ic VARCHAR(20) DEFAULT NULL,
    bulan VARCHAR(20),
    tahun INT,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    document_type ENUM('fee','attendance','monthly','general') DEFAULT 'general',
    amount DECIMAL(12,2) DEFAULT NULL,
    notes TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ib_action_logs_user_ic (user_ic),
    INDEX idx_ib_action_logs_month_year (bulan, tahun)
);

CREATE TABLE IF NOT EXISTS ib_document_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_type ENUM('fee','attendance') NOT NULL,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    flagged_by_ic VARCHAR(20) DEFAULT NULL,
    needs_clarification TINYINT(1) NOT NULL DEFAULT 1,
    send_back_to_pic TINYINT(1) NOT NULL DEFAULT 0,
    reason TEXT,
    notes TEXT,
    resolved TINYINT(1) NOT NULL DEFAULT 0,
    resolved_by_ic VARCHAR(20),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ib_document_flags_payment (payment_id),
    INDEX idx_ib_document_flags_attendance (attendance_id)
);

















INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0139273544', 'NOOR ANITA BINTI HASAN', '013-9273544', 'student', 'aktif'),
('S0166762445', 'MARIYATON BT MOHAMED JUSOH', '016-6762445', 'student', 'aktif'),
('S0129465850', 'ADLIN AFIQAH BT SUHAIMI', '012-9465850', 'student', 'aktif'),
('S0193565278', 'NORHASIMAH BINTI AMAT', '019-3565278', 'student', 'aktif'),
('S01139130562', 'NURREYNI MARTIZA BINTI MUHAMMAD ALI', '011-39130562', 'student', 'aktif'),
('S0199813029', 'ZAHARIAH BINTI MOHAMAD', '019-9813029', 'student', 'aktif'),
('S0177078384', 'SITI SURIA BINTI HAJI SHEIKH SALIM', '017-7078384', 'student', 'aktif'),
('S0139149723', 'RUHANI BT AWANG', '013-9149723', 'student', 'aktif'),
('S0199844865', 'NORASHIKIN BT JAMALUDIN', '019-9844865', 'student', 'aktif'),


('S0139271726', 'LAILA KARTINI BINTI CHE AB RAHMAN', '013-9271726', 'student', 'aktif'),
('S0199141303', 'RITA ERIYANA BINTI ABDULLAH SANI', '019-9141303', 'student', 'aktif'),
('S0139199070', 'SAMSUL BAHARIN BIN MUSTAFA', '013-9199070', 'student', 'aktif'),
('S0148153427', 'AWANG MERAH BIN ABDULLAH', '014-8153427', 'student', 'aktif'),
('S0138683610', 'ROSINA MOHAMED', '013-8683610', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';








INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
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





INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
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
    'S0132451715', 
    'S0139271726', 
    'S0199873239', 
    'S0199852115', 
    'S01155035710', 
    'S01158509745', 
    'S0169598989', 
    'S0199141303', 
    'S0199283284', 
    'S0199878760', 
    'S0142137747', 
    'S0139199070', 
    'S0148153427', 
    'S0138683610'  
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);







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



























INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S01126189920', 'SALLY SUWANI BINTI HASSAN', '011-26189920', 'student', 'aktif'),
('S0199451933', 'NUR BAITI BINTI SAMSUDDIN', '019-9451933', 'student', 'aktif'),
('S0169212178', 'AHMAD BIN ABDUL LATIFF', '016-9212178', 'student', 'aktif'),
('S0106592769', 'ENCIK SYARIZA JUSRI BIN ZULKIPLI', '010-6592769', 'student', 'aktif'),
('S0179730715', 'MUHD SYAH AMYZUL HAFIQ BIN FAUZIH', '017-9730715', 'student', 'aktif'),
('S0139601041', 'MOHD RIZAL BIN ISMAIL', '013-9601041', 'student', 'aktif'),
('S0139229103', 'ZAWAWI BIN YUSOP', '013-9229103', 'student', 'aktif'),
('S0199696462', 'MOHAMED ZAMRI BIN ABAS', '019-9696462', 'student', 'aktif'),
('S0125554964', 'NOR AZIRA BINTI ALIAS', '012-5554964', 'student', 'aktif'),
('S0199273210', 'MOHD AZHAR BIN ISMAIL', '019-9273210', 'student', 'aktif'),
('S0145251803', 'MUHAMMAD NUR SHAFIQ BIN MOHD HASHIM', '014-5251803', 'student', 'aktif'),
('S0162512368', 'NOOR AISHAH BINTI ALI', '016-2512368', 'student', 'aktif'),
('S0178338766', 'NABILA NAJWA BINTI MOHAMED ROSLY', '017-8338766', 'student', 'aktif'),
('S0126120781', 'FAIRO ANIZAN BIN IBRAHIM', '012-6120781', 'student', 'aktif'),
('S0106572176', 'MUHAMMAD HAJRUL ASWAD BIN AB RAHMAN', '010-6572176', 'student', 'aktif'),
('S0199448666', 'NORLIA BINTI ABDUL MANAF', '019-9448666', 'student', 'aktif'),
('S0139729556', 'HAJIRAHANIS BINTI MOHD SALLEH', '013-9729556', 'student', 'aktif'),
('S0123916645', 'SHARIZA BINTI MAT ARIS', '012-3916645', 'student', 'aktif'),
('S01133437529', 'NUR SYAKINAH SYAMIL BINTI SHAHRUL NIZAM', '011-33437529', 'student', 'aktif'),
('S0145472508', 'ABDUR RAHMAN BIN KAMARUZAMAN', '014-5472508', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';








INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-03' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0162457106' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'ASAS'
    AND jadual LIKE '%ISNIN%RABU%'
    AND jadual LIKE '%9.00%malam%'
    LIMIT 1
) c
WHERE u.ic IN (
    'S01126189920', 'S0199451933', 'S0169212178', 'S0106592769', 'S0179730715',
    'S0139601041', 'S0139229103', 'S0199696462', 'S0125554964', 'S0199273210',
    'S0145251803', 'S0162512368', 'S0178338766', 'S0126120781', 'S0106572176',
    'S0199448666', 'S0139729556', 'S0123916645', 'S01133437529', 'S0145472508'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);






UPDATE students s
JOIN users u ON s.user_ic = u.ic
SET s.kelas_id = (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0129571959' 
    AND nama_kelas LIKE '%IMAM MALIKI%'
    AND level = 'PERTENGAHAN'
    LIMIT 1
)
WHERE u.ic = 'S0145472508'
AND u.nama LIKE '%ABDUR RAHMAN%';






























INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
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

('SHUSIN001', 'HUSIN BIN MUHAMMAD ALI', NULL, 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = COALESCE(VALUES(telefon), telefon),
    status = 'aktif';







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0179565248A', 'MUFQI DANISH IQBAL BIN MOHD AZME', '017-9565248', 'student', 'aktif'),
('S0179565248B', 'MUFQI IERFAN HAFIZD BIN MOHD AZME', '017-9565248', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';








INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, 7, '2025-02-11' as tarikh_daftar
FROM users u
WHERE u.ic IN (
    'S0173584746', 'S0145359964', 'S0199214499', 'S01160732678', 'S0102745236',
    'S0194179438', 'S0138164020', 'S0124088454', 'S0193565278', 
    'S0172582997', 'S0123714723', 'S0179565248', 'S0139327488', 'S0139284748',
    'S0179067740', 'S0173317367', 'S0199883655', 
    'S0104312762', 'S0142231064', 'S0179565248A', 'S0179565248B',
    'SHUSIN001'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);






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





























INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0179525622', 'HURDY BIN HASHIM', '017-9525622', 'student', 'aktif'),
('S0137706137', 'ROSINAWATI BINTI SENANG', '013-7706137', 'student', 'aktif'),
('S0139822728', 'MOHD FARIK BIN ABDUL RAFFAR', '013-9822728', 'student', 'aktif'),
('S01125502915', 'MUHAMMAD FAIZ BIN ISMAIL', '011-25502915', 'student', 'aktif'),
('S0195415705', 'NURUL ADILAH BINTI HAMZAH', '019-5415705', 'student', 'aktif'),
('S01128664748', 'ATIKAH BINTI ABU BAKAR', '011-28664748', 'student', 'aktif'),
('S0199171636', 'HAMISAH BINTI MD YASSIM', '019-9171636', 'student', 'aktif'),
('S0139960295', 'JUHAR BIN IDRUS', '013-9960295', 'student', 'aktif'),
('S0142891085', 'NUR KAMARIAHAZIM BINTI ABDUL MUTTALIB', '014-2891085', 'student', 'aktif'),
('S01110216556', 'RAHAYU @ NORASHIKIN BINTI KADRI', '011-10216556', 'student', 'aktif'),
('S0133917707', 'NORAINI BINTI A MOHAMED', '013-3917707', 'student', 'aktif'),
('S0139386060', 'NORELA BINTI AHMAD', '013-9386060', 'student', 'aktif'),
('S0177078384', 'SITI SURIA BINTI HJ SHEIKH SALIM', '017-7078384', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';







INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT 
    u.ic,
    c.id,
    '2025-02-05' as tarikh_daftar
FROM users u
CROSS JOIN (
    SELECT id FROM classes 
    WHERE guru_ic = 'T0139000168' 
    AND nama_kelas LIKE '%IMAM HANAFI%'
    AND level = 'ASAS'
    AND jadual LIKE '%ISNIN%RABU%'
    AND jadual LIKE '%5.00%petang%'
    LIMIT 1
) c
WHERE u.ic IN (
    'S0179525622', 'S0137706137', 'S0139822728', 'S01125502915', 'S0195415705',
    'S01128664748', 'S0199171636', 'S0139960295', 'S0142891085', 'S01110216556',
    'S0133917707', 'S0139386060', 'S0177078384'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);








































INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES

('T0139000168', 'USTAZ MOHAMMAD WAZAR BIN MOHD DAWI', '0139000168', 'teacher', 'aktif'),
('T0162457106', 'USTAZ MUHAMMAD IHSAN BIN MHD ZAHARI', '0162457106', 'teacher', 'aktif'),
('T0199750534', 'USTAZ MOHD SAIFUL BAHARI BIN KASIM', '0199750534', 'teacher', 'aktif'),
('T0139046113', 'USTAZ A.ZUNNOR BIN ABD RAHMAN', '0139046113', 'teacher', 'aktif'),
('T0103949789', 'USTAZ MUHAMMAD NUR IZMAN BIN MOHD RAKHZAM', '0103949789', 'teacher', 'aktif'),


('T0129516044', 'USTAZ ZULKIFLI BIN YAAKUB', '0129516044', 'teacher', 'aktif'),
('T01137580463', 'USTAZ MUHAMMAD HASRIQ AZAMIE BIN SAIDI', '01137580463', 'teacher', 'aktif'),


('T0199706272', 'USTAZ MOHD NOOR BIN DIN', '0199706272', 'teacher', 'aktif'),
('T0129571959', 'USTAZ MOHD NIZAM BIN ABDUL GHANI', '0129571959', 'teacher', 'aktif'),
('T0136148671', 'USTAZ AHMAD BURHANUDDIN BIN ABDUL AZIZ', '0136148671', 'teacher', 'aktif'),
('T0148345656', 'USTAZ MUHAMMAD SOLAHUDDIN BIN SAMSUDDIN', '0148345656', 'teacher', 'aktif'),


('T0199684539', 'USTAZ MUHAMMAD HAFIZUDDIN BIN TAJUDDIN', '0199684539', 'teacher', 'aktif'),
('T0199165897', 'USTAZ AMIR HASIF BIN HATA', '0199165897', 'teacher', 'aktif'),
('T0199390972', 'USTAZ SHAIFUDDIN BIN NGAH', '0199390972', 'teacher', 'aktif'),


('T0139424413', 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', '0139424413', 'teacher', 'aktif'),


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




INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
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







INSERT IGNORE INTO classes (nama_kelas, level, jadual, sessions, yuran, guru_ic, kapasiti, status) VALUES

('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0139000168', 20, 'aktif'),
('ASAS - IMAM MALIKI (4IM)', 'ASAS', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0162457106', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199750534', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139046113', 20, 'aktif'),
('ASAS - IMAM HANAFI (4IH)', 'ASAS', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T0103949789', 20, 'aktif'),


('TAHSIN ASAS - IMAM MALIKI (4IM)', 'TAHSIN ASAS', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0129516044', 20, 'aktif'),
('TAHSIN ASAS - IMAM MALIKI (4IM)', 'TAHSIN ASAS', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T01137580463', 20, 'aktif'),


('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'ISNIN & RABU 5.00 pm - 6.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0199706272', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0129571959', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0136148671', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SELASA & KHAMIS 9.00 pm - 10.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139000168', 20, 'aktif'),
('PERTENGAHAN - IMAM MALIKI (4IM)', 'PERTENGAHAN', 'SABTU & AHAD 9.00 am - 10.30 am', JSON_ARRAY('SABTU', 'AHAD'), 150.00, 'T0148345656', 20, 'aktif'),


('LANJUTAN - IMAM HANAFI (2IH)', 'LANJUTAN', 'ISNIN & RABU 9.00 pm - 10.30 pm', JSON_ARRAY('ISNIN', 'RABU'), 150.00, 'T0199684539', 20, 'aktif'),
('LANJUTAN - IMAM SYAFIE (2IS)', 'LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199165897', 20, 'aktif'),
('LANJUTAN - IMAM HANAFI (2IH)', 'LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0199390972', 20, 'aktif'),


('TAHSIN LANJUTAN - IMAM HAMBALI (2IHb)', 'TAHSIN LANJUTAN', 'SELASA & KHAMIS 5.00 pm - 6.30 pm', JSON_ARRAY('SELASA', 'KHAMIS'), 150.00, 'T0139424413', 20, 'aktif'),


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





























SET @default_password = '$2a$12$CxcoVvzrbONuSFZQmMNElOu0jVDNBBKshnEoIT7IMSPbHS6gKAKeG';





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



















INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
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










INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
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


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
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


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
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

























INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S01999278126', 'MOHD AZWAN BIN ABDULLAH', '019-99278126', 'student', 'aktif'),
('S0199928468', 'AZDALINA BINTI BAKAR', '019-9928468', 'student', 'aktif'),
('S0125027773', 'MASITAH BINTI TAHIR', '012-5027773', 'student', 'aktif'),
('S0196125377', 'MD ZAIDEY BIN ABD KADIR', '019-6125377', 'student', 'aktif'),
('S0123130312', 'ADI FAZULI BIN MAMAT', '012-3130312', 'student', 'aktif'),
('S0178148442', 'WAN SAHIZAN WAN ISAMAIL', '017-8148442', 'student', 'aktif'),
('S0169898008', 'MOHD NIZAM BIN MOHD ISA', '016-9898008', 'student', 'aktif'),
('S0142947672', 'MOHAMAD FAKHRUL ADHAM BIN WAHID', '014-2947672', 'student', 'aktif'),
('S01128940369', 'NUR SHARMILA BT SABRI', '011-28940369', 'student', 'aktif'),
('S0169890009', 'RAHAYU BT JUSOH EMBONG', '016-9890009', 'student', 'aktif'),
('S0129853151', 'FAUZIAH BINTI DAUD', '012-9853151', 'student', 'aktif'),
('S0179744113', 'MOHD KHAIRUL IDWAN BIN MOHD ABIDIN', '017-9744113', 'student', 'aktif'),
('S01393204661', 'SYED MOHD SOHAIMI BIN SYED NORDIN', '013-93204661', 'student', 'aktif'),
('S0179732709', 'NORMAH BINTI ABDUL MALEK', '017-9732709', 'student', 'aktif'),
('S0139336162', 'NORLELAWATI BINTI ABDUL MANAF', '013-9336162', 'student', 'aktif'),
('S0132629753', 'NORSUHAILA BINTI MOHD GHAZALI', '013-2629753', 'student', 'aktif'),
('S01119474459', 'FAKHRUL ASYRAF BIN ABDULLAH', '011-19474459', 'student', 'aktif'),
('S0179881676', 'MUHAMMAD ILYAS HANIF BIN SHAMSUDDIN', '017-9881676', 'student', 'aktif'),
('S0189020187', 'NORMI FATHUL SHUHADA BINTI ABI RAHMAN', '018-9020187', 'student', 'aktif'),
('S01137587089', 'MOHAMMAD HASIF BIN AB RAHMAN', '011-37587089', 'student', 'aktif'),
('S0199883655', 'DZAWANI BT MUHAMAD', '019-9883655', 'student', 'aktif'),
('S0148448959', 'MD AZUANDY BIN MD ARIFFIN', '014-8448959', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';











































































INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0124664455', 'ROHANAH BINTI ATAN', '012-4664455', 'student', 'aktif'),
('S0139819437', 'SITI HAFIZAH BINTI AMJAD ALI', '013-9819437', 'student', 'aktif'),
('S0132407202', 'NORMALA BINTI NGAH', '013-2407202', 'student', 'aktif'),
('S01160902509', 'MUHAMMAD ZAMRI BIN MANSOR', '011-60902509', 'student', 'aktif'),
('S0139219059', 'ROSLELAWATI BINTI ARHAM', '013-9219059', 'student', 'aktif'),
('S0139346402', 'ZAKARIA BIN MUHAMMAD', '013-9346402', 'student', 'aktif'),
('S0192575907', 'MOHAMAD HAZIQ BIN ABU OTHMAN', '019-2575907', 'student', 'aktif'),
('S0195462234', 'NURULHUDA BINTI MOHD JOHARI', '019-5462234', 'student', 'aktif'),
('S0123712446', 'HAJJAH FADZILAH BINTI HJ OMAR', '012-3712446', 'student', 'aktif'),
('S0199330260', 'WAN ADNAN BIN WAN SHAFIE', '019-9330260', 'student', 'aktif'),
('S0139184575', 'SHAHRIL AZLIN BIN MOHTAR', '013-9184575', 'student', 'aktif'),
('S0189076844', 'NUR AFIFAH BINTI HAZLAN', '018-9076844', 'student', 'aktif'),
('S0199639857', 'NOR HALIZA BINTI MD AMIN', '019-9639857', 'student', 'aktif'),
('S0199285947', 'CHE IZANI BIN CHE HASSAN', '019-9285947', 'student', 'aktif'),
('S0129486132', 'WAN ANIZAR BINTI WAN MALEK', '012-9486132', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';































INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
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




ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199863810A', 'SYED MOHD AMRI', '019-9863810', 'student', 'aktif')

ON DUPLICATE KEY UPDATE 
    nama = VALUES(nama),
    telefon = VALUES(telefon),
    status = 'aktif';








INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, 8, '2025-02-04' as tarikh_daftar
FROM users u
WHERE u.ic IN (
    'S0199863810', 'S0139217817', 'S0194002030', 'S0199650133', 'S0167272739',
    'S0123910284', 'S01329173022', 'S0139283850', 'S0194757757', 'S0194757757A',
    'S01157712354', 'S0192944542', 'S01120804537', 'S0129983064', 'S0139140601',
    'S01139138004', 'S0199325059', 'S0199320059', 'S0199747572', 'S0148448959', 
    'S0199500170', 'S0199004750', 'S0139544303', 'S0112554074', 'S0199983313',
    'S0195789603', 'S0199863810A' 
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);
















USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0129565849', 'USTAZ AHMAD ZAKRI BIN SALLEH', '0129565849', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0129565849', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0129565849' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0129565849',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0129565849' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0129509397', 'KHAMISAH BINTI MONSI', '0129509397', 'student', 'aktif'),
('S0139823203', 'ASMAH BINTI AWANG', '0139823203', 'student', 'aktif'),
('S0199873011', 'FARIDAH OMAR', '0199873011', 'student', 'aktif'),
('S0162718832', 'HABSAH BINTI AHMAD', '0162718832', 'student', 'aktif'),
('S0199271828', 'UMI KALSOM BINTI KASIM', '0199271828', 'student', 'aktif'),
('S0139302535', 'MOHD KAMAL B MOHD ZIN', '0139302535', 'student', 'aktif'),
('S01110707404', 'NORIZAN BINTI IBRAHIM', '01110707404', 'student', 'aktif'),
('S0197744764', 'AZIZAH BT DAUD', '0197744764', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129509397', @kelas_hambali2_id, '2025-02-04'),
('S0139823203', @kelas_hambali2_id, '2025-02-04'),
('S0199873011', @kelas_hambali2_id, '2025-02-04'),
('S0162718832', @kelas_hambali2_id, '2025-02-04'),
('S0199271828', @kelas_hambali2_id, '2025-02-04'),
('S0139302535', @kelas_hambali2_id, '2025-02-04'),
('S01110707404', @kelas_hambali2_id, '2025-02-04'),
('S0197744764', @kelas_hambali2_id, '2025-02-04')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139043035', 'USTAZ AHMAD REDZUAN BIN AMAT', '0139043035', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139043035', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0139043035' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0139043035',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_hambali2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0139043035' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));


SET @kelas_faiz_id = (SELECT id FROM classes WHERE guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0129604919', 'MOHD FAZIRULLAH BIN ABDUL MAJID', '0129604919', 'student', 'aktif'),
('S0199823311', 'KHATIJAH BINTI DIN', '0199823311', 'student', 'aktif'),
('S0199908315', 'FARIDAH BINTI ALI', '0199908315', 'student', 'aktif'),
('S01111194233', 'HAFIZA BINTI MOHD ROOM', '01111194233', 'student', 'aktif'),
('S0139275033', 'LATIFAH BINTI OTHMAN', '0139275033', 'student', 'aktif'),
('S0178500503', 'FARHANAH BINTI OTHMAN', '0178500503', 'student', 'aktif'),
('S0127805242', 'AZARIZA BINTI MUDA', '0127805242', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129604919', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0199823311', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0199908315', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S01111194233', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0139275033', @kelas_talaqqi_hambali2_id, '2025-02-06'),
('S0178500503', @kelas_talaqqi_hambali2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0127805242', COALESCE(@kelas_faiz_id, @kelas_talaqqi_hambali2_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_faiz_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;









INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0148391236', 'USTAZ FARIDNUDDIN BIN MUHAMAD', '0148391236', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0148391236', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (2IHb)%' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (2IHb)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (9.00 malam - 10.30 malam)',
    150.00,
    'T0148391236',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali2_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (2IHb)' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));


SET @kelas_ikhram_id = (SELECT id FROM classes WHERE guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0166897199', 'MOHD BASIUNI BIN YAACOB', '0166897199', 'student', 'aktif'),
('S0139708365', 'AIZA ASMAD BIN IBRAHIM', '0139708365', 'student', 'aktif'),
('S0104428762', 'KAMARIAH BINTI ISMAIL', '0104428762', 'student', 'aktif'),
('S0109887106', 'FAUZIAH BINTI ALI', '0109887106', 'student', 'aktif'),
('S0108462115', 'NOOR FUDZIAN BT ABU BAKAR', '0108462115', 'student', 'aktif'),
('S0145107267', 'AKMAL AISHAH BINTI RAHIMI', '0145107267', 'student', 'aktif'),
('S0199887956', 'KHAFSAH BINTI MOHD SHAIEN', '0199887956', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0166897199', @kelas_hambali2_evening_id, '2025-02-06'),
('S0139708365', @kelas_hambali2_evening_id, '2025-02-06'),
('S0104428762', @kelas_hambali2_evening_id, '2025-02-06'),
('S0109887106', @kelas_hambali2_evening_id, '2025-02-06'),
('S0108462115', @kelas_hambali2_evening_id, '2025-02-06'),
('S0145107267', @kelas_hambali2_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199887956', COALESCE(@kelas_ikhram_id, @kelas_hambali2_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_ikhram_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0134673494', 'USTAZ TENGKU FATHUL B TENGKU ABD MUTALIB', '0134673494', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0134673494', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0134673494' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0134673494',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali3_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0134673494' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199502289', 'ROSILAWATI BINTI ZAKARIA', '0199502289', 'student', 'aktif'),
('S0139593943', 'SHAMSIAH BINTI OTHMAN', '0139593943', 'student', 'aktif'),
('S0195115358', 'NURULSHUHADA BINTI MAT NOR', '0195115358', 'student', 'aktif'),
('S0199522332', 'NORHAYATI BINTI ABD AZIZ', '0199522332', 'student', 'aktif'),
('S0148338913', 'RUHANI BINTI MD ISA', '0148338913', 'student', 'aktif'),
('S0139115776', 'DIANARISA BINTI MOHD BADRI', '0139115776', 'student', 'aktif'),
('S0139802535', 'KHADZIJAH BINTI IBRAHIM', '0139802535', 'student', 'aktif'),
('S0179408807', 'NOR AZNI BINTI WAHAB', '0179408807', 'student', 'aktif'),
('S0145055462', 'NOOR AZIZAN BINTI ABD AZIZ', '0145055462', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199502289', @kelas_hambali3_id, '2025-02-06'),
('S0139593943', @kelas_hambali3_id, '2025-02-06'),
('S0195115358', @kelas_hambali3_id, '2025-02-06'),
('S0199522332', @kelas_hambali3_id, '2025-02-06'),
('S0148338913', @kelas_hambali3_id, '2025-02-06'),
('S0139115776', @kelas_hambali3_id, '2025-02-06'),
('S0139802535', @kelas_hambali3_id, '2025-02-06'),
('S0179408807', @kelas_hambali3_id, '2025-02-06'),
('S0145055462', @kelas_hambali3_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139095315', 'USTAZ SULAIMAN BIN NORDIN', '0139095315', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139095315', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139095315',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_hambali3_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0129661672', 'ABDUL HADI BIN HAMID', '0129661672', 'student', 'aktif'),
('S0172227206', 'FATIMAH MARDHIYAH BINTI IZRAM', '0172227206', 'student', 'aktif'),
('S0102020512', 'HASNAH BINTI ARSHAD', '0102020512', 'student', 'aktif'),
('S0179276040', 'NORRIYATI BINTI MOHD ZIN', '0179276040', 'student', 'aktif'),
('S0126849090', 'RAFIDAH BINTI ABDUL RAHMAN', '0126849090', 'student', 'aktif'),
('S0139208138', 'ROHAYATI BT HANAFI', '0139208138', 'student', 'aktif'),
('S0199247659', 'SAMSUDIN BIN MOHD YATIM', '0199247659', 'student', 'aktif'),
('S0139327285', 'ZALILAH BT SAPUAN', '0139327285', 'student', 'aktif'),
('S0113514615', 'HAZMI BIN MUSTAFA', '0113514615', 'student', 'aktif'),
('S0129839089', 'NOR''AINI BINTI MHD BASARI', '0129839089', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129661672', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0172227206', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0102020512', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0179276040', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0126849090', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0139208138', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0199247659', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0139327285', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0113514615', @kelas_talaqqi_hambali3_id, '2025-02-06'),
('S0129839089', @kelas_talaqqi_hambali3_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0199884408', 'USTAZ MOHD FADILAH BIN ABDUL MANAF', '0199884408', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0199884408', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (3IHb)%' AND guru_ic = 'T0199884408' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (3IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0199884408',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali3_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (3IHb)' AND guru_ic = 'T0199884408' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0122193614', 'AHMAD SHAIFUDDIN B ABDUL MANAF', '0122193614', 'student', 'aktif'),
('S0179119600', 'HAMDAN BIN MOHD SAHAL', '0179119600', 'student', 'aktif'),
('S0179119644', 'NOR DALILA BT ABD KARIM', '0179119644', 'student', 'aktif'),
('S0137592214', 'NOR AZIZAH BINTI ZAKAWI', '0137592214', 'student', 'aktif'),
('S0199166786', 'MANAHNI BT MOHAMAD', '0199166786', 'student', 'aktif'),
('S0145040650', 'ZAINAB BT MUDA', '0145040650', 'student', 'aktif'),
('S01137434469', 'SADIAH BT MUDA', '01137434469', 'student', 'aktif'),
('S0145454292', 'ZALILAH BT ADAM', '0145454292', 'student', 'aktif'),
('S0139277323', 'NOOR HUBAIDA BT DAUD', '0139277323', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0122193614', @kelas_hambali3_evening_id, '2025-02-06'),
('S0179119600', @kelas_hambali3_evening_id, '2025-02-06'),
('S0179119644', @kelas_hambali3_evening_id, '2025-02-06'),
('S0137592214', @kelas_hambali3_evening_id, '2025-02-06'),
('S0199166786', @kelas_hambali3_evening_id, '2025-02-06'),
('S0145040650', @kelas_hambali3_evening_id, '2025-02-06'),
('S01137434469', @kelas_hambali3_evening_id, '2025-02-06'),
('S0145454292', @kelas_hambali3_evening_id, '2025-02-06'),
('S0139277323', @kelas_hambali3_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139222728', 'USTAZ MOHD HASNUL MINZAR BIN ISMAIL', '0139222728', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139222728', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (4IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0139222728',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali4_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (4IHb)' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));


SET @kelas_hambali4_afternoon_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0139222728' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


SET @kelas_faiz_id = (SELECT id FROM classes WHERE guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199999383', 'ASRI BIN GHAZALI', '0199999383', 'student', 'aktif'),
('S0199132829', 'NAZIAH KAMUN', '0199132829', 'student', 'aktif'),
('S0199886969', 'NOOR LILI BINTI MOHD AMIN', '0199886969', 'student', 'aktif'),
('S0179525550', 'ROHAYA BINTI ADIN', '0179525550', 'student', 'aktif'),
('S0169225046', 'SURIA BINTI AHMAD', '0169225046', 'student', 'aktif'),
('S0199891900', 'IBRAHIM BIN ABDUL MALEK', '0199891900', 'student', 'aktif'),
('S0199895576', 'RODHUAN BIN AHMAD', '0199895576', 'student', 'aktif'),
('S0139598575', 'NUR HAZIQAH BINTI RAZALI', '0139598575', 'student', 'aktif'),
('S0139940025', 'HJ. ALAM SHAH BIN HJ. SALLEH', '0139940025', 'student', 'aktif'),
('S0199326768', 'ZANARIAH BINTI RAMLI @ KADIR', '0199326768', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199999383', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199132829', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199886969', @kelas_hambali4_evening_id, '2025-02-06'),
('S0179525550', @kelas_hambali4_evening_id, '2025-02-06'),
('S0169225046', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199891900', @kelas_hambali4_evening_id, '2025-02-06'),
('S0199895576', @kelas_hambali4_evening_id, '2025-02-06'),
('S0139598575', @kelas_hambali4_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139940025', COALESCE(@kelas_hambali4_afternoon_id, @kelas_hambali4_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_hambali4_afternoon_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199326768', COALESCE(@kelas_faiz_id, @kelas_hambali4_evening_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_faiz_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0192902007', 'USTAZ HASRUL AZHAN BIN HARUN', '0192902007', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0192902007', JSON_ARRAY('TALAQQI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HAMBALI (4IHb)%' AND guru_ic = 'T0192902007' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HAMBALI (4IHb)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0192902007',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hambali4_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HAMBALI (4IHb)' AND guru_ic = 'T0192902007' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0179441048', 'ROKIAH BINTI MAT RANI', '0179441048', 'student', 'aktif'),
('S0122602958', 'CHE ROHANI BINTI MOHAMED SALLEH', '0122602958', 'student', 'aktif'),
('S0199890507', 'PARISAH BINTI HJ TEL', '0199890507', 'student', 'aktif'),
('S0199266886', 'ROGAYAH BINTI OMAR', '0199266886', 'student', 'aktif'),
('S0139807447', 'RASLI BIN JAMIL', '0139807447', 'student', 'aktif'),
('S0199430767', 'AB AZIZ BIN ZAKARIA', '0199430767', 'student', 'aktif'),
('S01125637366', 'NORMAH BT IBRAHIM', '01125637366', 'student', 'aktif'),
('S0139894505', 'HJ. HAMIN BIN HJ. MOHAMAD', '0139894505', 'student', 'aktif'),
('S0179119155', 'MARIAM BINTI NGAH', '0179119155', 'student', 'aktif'),
('S0139349697', 'WAN FAIZAH BINTI WAN MAHMOOD', '0139349697', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0179441048', @kelas_hambali4_id, '2025-02-06'),
('S0122602958', @kelas_hambali4_id, '2025-02-06'),
('S0199890507', @kelas_hambali4_id, '2025-02-06'),
('S0199266886', @kelas_hambali4_id, '2025-02-06'),
('S0139807447', @kelas_hambali4_id, '2025-02-06'),
('S0199430767', @kelas_hambali4_id, '2025-02-06'),
('S01125637366', @kelas_hambali4_id, '2025-02-06'),
('S0139894505', @kelas_hambali4_id, '2025-02-06'),
('S0179119155', @kelas_hambali4_id, '2025-02-06'),
('S0139349697', @kelas_hambali4_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01115996053', 'USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN', '01115996053', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01115996053', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (1IH)%' AND guru_ic = 'T01115996053' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (1IH)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01115996053',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_hanafi1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (1IH)' AND guru_ic = 'T01115996053' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0179776901', 'ROZIHAN BT HASSAN', '0179776901', 'student', 'aktif'),
('S0199659648', 'SABARIAH BINTI HASAN', '0199659648', 'student', 'aktif'),
('S0199500823', 'DATO MIMI BT HJ ABDUL MALIK', '0199500823', 'student', 'aktif'),
('S0129634275', 'DATIN MUZAH BINTI ABU BAKAR', '0129634275', 'student', 'aktif'),
('S0129627601', 'ZAINAB BT ZAKARIA', '0129627601', 'student', 'aktif'),
('S0148166456', 'CHE KU ROSNI BT CHE KU MAN', '0148166456', 'student', 'aktif'),
('S0199718010', 'ROSMAINI BINTI ABDUL GHANI', '0199718010', 'student', 'aktif'),
('S0139239197', 'NAEMAH BINTI HJI ALI', '0139239197', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0179776901', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199659648', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199500823', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0129634275', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0129627601', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0148166456', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0199718010', @kelas_talaqqi_hanafi1_id, '2025-02-12'),
('S0139239197', @kelas_talaqqi_hanafi1_id, '2025-02-12')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01110637156', 'USTAZ MUHAMMAD IKHRAM BIN ZAINAL', '01110637156', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01110637156', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (2IH)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01110637156',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T01110637156' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199217662', 'NOR ZAKIAH MANSOR', '0199217662', 'student', 'aktif'),
('S0179408366', 'FARIDAH BT MD. RADZUAN', '0179408366', 'student', 'aktif'),
('S0199584117', 'SALBIAH BTE ABD HAMID', '0199584117', 'student', 'aktif'),
('S0139363069', 'MOHD KHAIRUL ANUAR BIN MD MUSTAFA', '0139363069', 'student', 'aktif'),
('S0139373167', 'ROMANA BINTI RAM', '0139373167', 'student', 'aktif'),
('S01156747791', 'ROHANA BINTI HUSSIN', '01156747791', 'student', 'aktif'),
('S0179097585', 'MD MOKHTAR BIN ABDULLAH', '0179097585', 'student', 'aktif'),
('S01111249193', 'RASHIDAH BT SEMAN', '01111249193', 'student', 'aktif'),
('S01128941414B', 'ROSMAH BINTI ABD RAHMAN', '01128941414', 'student', 'aktif'),
('S0199887956', 'KHAFSAH BINTI MOHD SHAIEN', '0199887956', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199217662', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0179408366', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0199584117', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0139363069', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0139373167', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01156747791', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0179097585', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01111249193', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S01128941414B', @kelas_talaqqi_hanafi2_id, '2025-02-12'),
('S0199887956', @kelas_talaqqi_hanafi2_id, '2025-02-12')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01115996053', 'USTAZ UWEIS ALQARNI BIN ABDUL RAHMAN', '01115996053', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01115996053', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T01115996053' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
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


SET @kelas_talaqqi_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T01115996053' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
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


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
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





USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0189678653', 'USTAZ MUHAMMAD SABRI BIN RAZALI', '0189678653', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0189678653', JSON_ARRAY('TALAQQI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM HANAFI (2IH)%' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM HANAFI (2IH)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0189678653',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_hanafi2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM HANAFI (2IH)' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0146086863', 'AMINAH BT A. RAHIM', '0146086863', 'student', 'aktif'),
('S0179778246A', 'ENDOK SELOH BINTI ABDULLAH WAHAB', '0179778246', 'student', 'aktif'),
('S0129003301A', 'NORAISHAH BINTI KHAMALRUDIN', '0129003301', 'student', 'aktif'),
('S0199777313', 'WAN RUZAINI BT JOHARI', '0199777313', 'student', 'aktif'),
('S0142930881', 'ZAMRI BIN MOHAMED', '0142930881', 'student', 'aktif'),
('S0136971694', 'WAN FARIDAH BT WAN MAJID', '0136971694', 'student', 'aktif'),
('S0199313709', 'ALIAH BIN JUSOH', '0199313709', 'student', 'aktif'),
('S019983708', 'ININ BINTI AWI', '019983708', 'student', 'aktif'),
('S0179778246B', 'HASNAH BINTI OSMAN', '0179778246', 'student', 'aktif'),
('S0129833708', 'ROHAYATI BINTI AB. WAHAB', '0129833708', 'student', 'aktif'),
('S0129003301B', 'NORJULIAWATI BT ABDUL GHANI', '0129003301', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0146086863', @kelas_hanafi2_id, '2025-02-06'),
('S0179778246A', @kelas_hanafi2_id, '2025-02-06'),
('S0129003301A', @kelas_hanafi2_id, '2025-02-06'),
('S0199777313', @kelas_hanafi2_id, '2025-02-06'),
('S0142930881', @kelas_hanafi2_id, '2025-02-06'),
('S0136971694', @kelas_hanafi2_id, '2025-02-06'),
('S0199313709', @kelas_hanafi2_id, '2025-02-06'),
('S019983708', @kelas_hanafi2_id, '2025-02-06'),
('S0179778246B', @kelas_hanafi2_id, '2025-02-06'),
('S0129833708', @kelas_hanafi2_id, '2025-02-06'),
('S0129003301B', @kelas_hanafi2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01111015704', 'USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF', '01111015704', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01111015704', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (1IM)%' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (1IM)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T01111015704',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_maliki1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (1IM)' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199808015', 'ASIAH BINTI ENDOT', '0199808015', 'student', 'aktif'),
('S0139522434', 'FATIMAH BINTI GANAL @ ZAINAL', '0139522434', 'student', 'aktif'),
('S0195554641', 'ISMA KHAIRUL BIN ISMAIL', '0195554641', 'student', 'aktif'),
('S0129479794', 'MEK ZAH@ZAIDAH BINTI JUSOH', '0129479794', 'student', 'aktif'),
('S0168249711', 'TUAN LAILY SURAYA BINTI TUAN LONG', '0168249711', 'student', 'aktif'),
('S0199566463', 'YUSRI BIN MOHD ALI', '0199566463', 'student', 'aktif'),
('S0193862911', 'MOHD HAMIJA BIN ABD RAZALI', '0193862911', 'student', 'aktif'),
('S0129286364', 'NORJIAH BINTI SUDIRAN', '0129286364', 'student', 'aktif'),
('S0132216725', 'ROHAYA BINTI ABD RAHMAN', '0132216725', 'student', 'aktif'),
('S0199326768', 'ZANARIAH BT RAMLI @ ZAINAL', '0199326768', 'student', 'aktif'),
('S0127805242', 'AZARIZA BINTI MUDA', '0127805242', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199808015', @kelas_maliki1_id, '2025-02-06'),
('S0139522434', @kelas_maliki1_id, '2025-02-06'),
('S0195554641', @kelas_maliki1_id, '2025-02-06'),
('S0129479794', @kelas_maliki1_id, '2025-02-06'),
('S0168249711', @kelas_maliki1_id, '2025-02-06'),
('S0199566463', @kelas_maliki1_id, '2025-02-06'),
('S0193862911', @kelas_maliki1_id, '2025-02-06'),
('S0129286364', @kelas_maliki1_id, '2025-02-06'),
('S0132216725', @kelas_maliki1_id, '2025-02-06'),
('S0199326768', @kelas_maliki1_id, '2025-02-06'),
('S0127805242', @kelas_maliki1_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139222728', 'USTAZ MOHD HASNUL MINZAR BIN ISMAIL', '0139222728', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139222728', JSON_ARRAY('TALAQQI', 'IMAM MALIKI', 'IMAM HAMBALI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (1IM)%' AND guru_ic = 'T0139222728' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (1IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139222728',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_maliki1_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (1IM)' AND guru_ic = 'T0139222728' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0129889592', 'CHE ROHAYU BT CHE YUSOFF', '0129889592', 'student', 'aktif'),
('S0139878327', 'HJH NOR ZIHAN BT HJ HARUN', '0139878327', 'student', 'aktif'),
('S0197140472', 'KAMARUL BAHYAH BINTI MUSTAFA', '0197140472', 'student', 'aktif'),
('S0199313410', 'NOORLEYDA BINTI AHMAD', '0199313410', 'student', 'aktif'),
('S0182970020', 'SITI ZURINA BINTI ZAHARI', '0182970020', 'student', 'aktif'),
('S0133336610', 'TUTY MARDYNA BINTI HARUN', '0133336610', 'student', 'aktif'),
('S0199231029', 'HAJAH HALIMAH BINTI HAJI ALI', '0199231029', 'student', 'aktif'),
('S0146058455', 'ZAINUM BINTI MOHD', '0146058455', 'student', 'aktif'),
('S0199932947', 'AMINAH BINTI MAHMOOD', '0199932947', 'student', 'aktif'),
('S0142915609', 'NORHAYATI BT ABU BAKAR', '0142915609', 'student', 'aktif'),
('S0199886969', 'NOOR LILI BINTI MOHD AMIN', '0199886969', 'student', 'aktif'),
('S0139940025', 'HJ. ALAM SHAH BIN HJ. SALLEH', '0139940025', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129889592', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0139878327', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0197140472', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199313410', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0182970020', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0133336610', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199231029', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0146058455', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199932947', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0142915609', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0199886969', @kelas_talaqqi_maliki1_id, '2025-02-06'),
('S0139940025', @kelas_talaqqi_maliki1_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139046113', 'USTAZ A.ZUNNOR BIN ABD RAHMAN', '0139046113', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139046113', JSON_ARRAY('TALAQQI', 'IMAM MALIKI', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T0139046113' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0139046113',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_maliki2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T0139046113' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


SET @kelas_sulaiman_id = (SELECT id FROM classes WHERE guru_ic = 'T0139095315' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0102221509', 'SHAHRIDAN BINTI AIZAD', '0102221509', 'student', 'aktif'),
('S0139077773', 'FATIMAH BINTI HASHIM', '0139077773', 'student', 'aktif'),
('S0196485880', 'MAH BT EMBONG', '0196485880', 'student', 'aktif'),
('S0199852475', 'ALIMSIAH BINTI AW ENDUT', '0199852475', 'student', 'aktif'),
('S0149913394', 'CHE KU ROSNI BT CHE KU MAN', '0149913394', 'student', 'aktif'),
('S0199805429', 'RUZIMAH BINTI HAMID', '0199805429', 'student', 'aktif'),
('S0123923038', 'MAT DESA BIN NANYAN', '0123923038', 'student', 'aktif'),
('S0139351162', 'FARIDAH BINTI ALIAS', '0139351162', 'student', 'aktif'),
('S0199799183', 'KHAMSAH BINTI MAHMUD', '0199799183', 'student', 'aktif'),
('SPUTERIZULAIQHA001', 'PUTERI ZULAIQHA', NULL, 'student', 'aktif'),
('S0129839089', 'NOR''AINI BINTI MHD BASARI', '0129839089', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0102221509', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0139077773', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0196485880', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199852475', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0149913394', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199805429', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0123923038', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0139351162', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('S0199799183', @kelas_talaqqi_maliki2_id, '2025-02-07'),
('SPUTERIZULAIQHA001', @kelas_talaqqi_maliki2_id, '2025-02-07')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0129839089', COALESCE(@kelas_sulaiman_id, @kelas_talaqqi_maliki2_id), '2025-02-07')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_sulaiman_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0139326688', 'USTAZ NASHARUDDIN BIN NGAH', '0139326688', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0139326688', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T0139326688' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (9.00 malam - 10.30 malam)',
    150.00,
    'T0139326688',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_maliki2_evening_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T0139326688' AND (jadual LIKE '%SELASA & KHAMIS (9.00 malam - 10.30 malam)%' OR jadual LIKE '%SELASA & KHAMIS 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0139831096', 'ZAINUNDIN AHMAD', '0139831096', 'student', 'aktif'),
('S0139220805', 'HJ. BRAHIM BIN HJ. ULIS', '0139220805', 'student', 'aktif'),
('S0199162251', 'MOHD NADHIR BIN MAT SALLEH@ AB.HAMID', '0199162251', 'student', 'aktif'),
('S0129212640', 'ZAHARIDAH BINTI MANSOR', '0129212640', 'student', 'aktif'),
('S0139383483', 'JAMAL NASSER BIN SALLEH', '0139383483', 'student', 'aktif'),
('S0199911656', 'RUSMANI BINTI YUNUS', '0199911656', 'student', 'aktif'),
('S0193300147', 'ABU BIN SYAFIE', '0193300147', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139831096', @kelas_maliki2_evening_id, '2025-02-06'),
('S0139220805', @kelas_maliki2_evening_id, '2025-02-06'),
('S0199162251', @kelas_maliki2_evening_id, '2025-02-06'),
('S0129212640', @kelas_maliki2_evening_id, '2025-02-06'),
('S0139383483', @kelas_maliki2_evening_id, '2025-02-06'),
('S0199911656', @kelas_maliki2_evening_id, '2025-02-06'),
('S0193300147', @kelas_maliki2_evening_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01121621582', 'USTAZ MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI', '01121621582', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01121621582', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (5IM)%' AND guru_ic = 'T01121621582' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (5IM)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T01121621582',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_maliki5_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (5IM)' AND guru_ic = 'T01121621582' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199263642', 'MOHAMAD BIN RIPIN', '0199263642', 'student', 'aktif'),
('S0169618649', 'SURIYATI BINTI MOHD LAZIM', '0169618649', 'student', 'aktif'),
('S0169352769', 'ZULKIFLI BIN RAMLI', '0169352769', 'student', 'aktif'),
('S0183999061', 'SITI RUKSHANA BINTI GULAM KHAN', '0183999061', 'student', 'aktif'),
('S0139939096', 'ROSELIZA HAIDA BT AHMAD', '0139939096', 'student', 'aktif'),
('S0129529850', 'ROHAYU BINTI MOHAMAD', '0129529850', 'student', 'aktif'),
('S01128941414', 'ROSMAWATI BINTI ABD RAHMAN', '01128941414', 'student', 'aktif'),
('S0199822802', 'RAJA SUHAINI BINTI RAJA SALLEHUDIN', '0199822802', 'student', 'aktif'),
('S0129509397', 'KHAMISAH BINTI MONSI', '0129509397', 'student', 'aktif'),
('S0199733012', 'FARAH NURAIN BINTI MUHAMMAD KHAIRUL ANUAR KANNUMALAR', '0199733012', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199263642', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0169618649', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0169352769', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0183999061', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0139939096', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0129529850', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S01128941414', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0199822802', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0129509397', @kelas_talaqqi_maliki5_id, '2025-02-06'),
('S0199733012', @kelas_talaqqi_maliki5_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T01111015704', 'USTAZ AHMAD HAYATUL FAIZ BIN ABD LATIF', '01111015704', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T01111015704', JSON_ARRAY('TALAQQI', 'IMAM MALIKI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM MALIKI (2IM)%' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM MALIKI (2IM)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T01111015704',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_maliki_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM MALIKI (2IM)' AND guru_ic = 'T01111015704' AND jadual LIKE '%ISNIN & RABU (5.00 petang - 6.30 petang)%' LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199789853', 'ASMAH BINTI AHMAD', '0199789853', 'student', 'aktif'),
('S0139271964', 'FATIMAH BINTI ABU SAMAH', '0139271964', 'student', 'aktif'),
('S0199819606', 'HJH ROHANA BT HJ ABD RANI', '0199819606', 'student', 'aktif'),
('S0199592850', 'NOOR HAYATI BT DZAKARIA', '0199592850', 'student', 'aktif'),
('S0199866000', 'NORHAYATI BINTI ABDULLAH', '0199866000', 'student', 'aktif'),
('S01159095821', 'ROSNAH BINTI AHMAD', '01159095821', 'student', 'aktif'),
('S0133356836', 'ZAIMAH BINTI DAPAT', '0133356836', 'student', 'aktif'),
('S0136464525', 'FARAH ADIBAH BINTI ALAM SHAH', '0136464525', 'student', 'aktif'),
('S0197744764', 'AZIZAH BT DAUD', '0197744764', 'student', 'aktif'),
('S0132216725', 'ROHAYA BINTI ABD RAHMAN', '0132216725', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199789853', @kelas_maliki_id, '2025-02-06'),
('S0139271964', @kelas_maliki_id, '2025-02-06'),
('S0199819606', @kelas_maliki_id, '2025-02-06'),
('S0199592850', @kelas_maliki_id, '2025-02-06'),
('S0199866000', @kelas_maliki_id, '2025-02-06'),
('S01159095821', @kelas_maliki_id, '2025-02-06'),
('S0133356836', @kelas_maliki_id, '2025-02-06'),
('S0136464525', @kelas_maliki_id, '2025-02-06'),
('S0197744764', @kelas_maliki_id, '2025-02-06'),
('S0132216725', @kelas_maliki_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0148391236', 'USTAZ FARIDNUDDIN BIN MUHAMAD', '0148391236', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0148391236', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (2IS)%' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM SYAFI''E (2IS)',
    'TALAQQI',
    JSON_ARRAY('SELASA', 'KHAMIS'),
    'SELASA & KHAMIS (5.00 petang - 6.30 petang)',
    150.00,
    'T0148391236',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_syafie2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (2IS)' AND guru_ic = 'T0148391236' AND (jadual LIKE '%SELASA & KHAMIS (5.00 petang - 6.30 petang)%' OR jadual LIKE '%SELASA & KHAMIS 5.00 pm - 6.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0139845534', 'MAIMAH BT OSMAN', '0139845534', 'student', 'aktif'),
('S0199161884', 'NOR''AIN BINTI OSMAN', '0199161884', 'student', 'aktif'),
('S0139272151', 'RAHIMAH BINTI DOL', '0139272151', 'student', 'aktif'),
('S0139375763', 'NORA BINTI MAARIS', '0139375763', 'student', 'aktif'),
('S0199323858', 'OTHMAN BIN MOHAMMAD', '0199323858', 'student', 'aktif'),
('S0139812099', 'AZIZAH BINTI RASHID', '0139812099', 'student', 'aktif'),
('S0139278575', 'ABDUL GHANI BIN IBRAHIM', '0139278575', 'student', 'aktif'),
('S0199820872', 'ZAIMAH BINTI DOL', '0199820872', 'student', 'aktif'),
('S01110815345', 'CHE ROHANA BINTI RAMLI', '01110815345', 'student', 'aktif'),
('S0134855026', 'ZARINA BINTI ABD RANI', '0134855026', 'student', 'aktif'),
('SSITIHAWA001', 'SITI HAWA', NULL, 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0139845534', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199161884', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139272151', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139375763', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199323858', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139812099', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139278575', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199820872', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S01110815345', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0134855026', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('SSITIHAWA001', @kelas_talaqqi_syafie2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0189678653', 'USTAZ MUHAMMAD SABRI BIN RAZALI', '0189678653', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0189678653', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E', 'IMAM HANAFI'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (2IS)%' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
SELECT 
    'TALAQQI - IMAM SYAFI''E (2IS)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (9.00 malam - 10.30 malam)',
    150.00,
    'T0189678653',
    20,
    'aktif'
WHERE @existing_class_id IS NULL;


SET @kelas_talaqqi_syafie2_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (2IS)' AND guru_ic = 'T0189678653' AND jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' LIMIT 1));


SET @kelas_sukri_id = (SELECT id FROM classes WHERE guru_ic = (SELECT ic FROM users WHERE telefon = '0197278384' OR nama LIKE '%MOHD SUKRI%CHE MAT%' LIMIT 1) LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199313907', 'BAHARUDIN BIN AWANG ZAINUDIN', '0199313907', 'student', 'aktif'),
('S0195320972', 'JAMAT BIN RUSIDIN', '0195320972', 'student', 'aktif'),
('S0179036570', 'KHARUDDIN BIN ABD MALEK', '0179036570', 'student', 'aktif'),
('S0199153357', 'MOHD REDZUAN BIN MOHD SALLEH', '0199153357', 'student', 'aktif'),
('S0139656412', 'SARIFAH BINTI YAZID', '0139656412', 'student', 'aktif'),
('S0143187215', 'SHARIFAH ANAIZAH BINTI SYED ALI', '0143187215', 'student', 'aktif'),
('S0199895171', 'WAN ZAITUN BT WAN YAHYA', '0199895171', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);



INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199313907', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0195320972', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0179036570', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0199153357', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0139656412', @kelas_talaqqi_syafie2_id, '2025-02-06'),
('S0143187215', @kelas_talaqqi_syafie2_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199895171', COALESCE(@kelas_sukri_id, @kelas_talaqqi_syafie2_id), '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=COALESCE(@kelas_sukri_id, VALUES(kelas_id)), tarikh_daftar=VALUES(tarikh_daftar);





USE masjid_app;








INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0197278384', 'USTAZ MOHD SUKRI BIN CHE MAT', '0197278384', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0197278384', JSON_ARRAY('TALAQQI', 'IMAM SYAFI''E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


SET @existing_class_id = (SELECT id FROM classes WHERE nama_kelas LIKE '%TALAQQI%IMAM SYAFI%E (5IS)%' AND guru_ic = 'T0197278384' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status)
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


SET @kelas_talaqqi_syafie5_id = COALESCE(@existing_class_id, (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI''E (5IS)' AND guru_ic = 'T0197278384' AND (jadual LIKE '%ISNIN & RABU (9.00 malam - 10.30 malam)%' OR jadual LIKE '%ISNIN & RABU 9.00 pm - 10.30 pm%') ORDER BY id DESC LIMIT 1));


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
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


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
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





USE masjid_app;







INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('T0129457975', 'USTAZ MOHD FADZLI BIN OTHMAN', '0129457975', 'teacher', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO teachers (user_ic, kepakaran) VALUES
('T0129457975', JSON_ARRAY('TALAQQI', 'IMAM SYAFI\'E'))
ON DUPLICATE KEY UPDATE kepakaran=VALUES(kepakaran);


INSERT IGNORE INTO classes (nama_kelas, level, sessions, jadual, yuran, guru_ic, kapasiti, status) VALUES
(
    'TALAQQI - IMAM SYAFI\'E (4IS)',
    'TALAQQI',
    JSON_ARRAY('ISNIN', 'RABU'),
    'ISNIN & RABU (5.00 petang - 6.30 petang)',
    150.00,
    'T0129457975',
    20,
    'aktif'
)
ON DUPLICATE KEY UPDATE 
    level=VALUES(level),
    sessions=VALUES(sessions),
    jadual=VALUES(jadual),
    yuran=VALUES(yuran),
    guru_ic=VALUES(guru_ic),
    kapasiti=VALUES(kapasiti),
    status=VALUES(status);


SET @kelas_syafie_id = (SELECT id FROM classes WHERE nama_kelas = 'TALAQQI - IMAM SYAFI\'E (4IS)' AND guru_ic = 'T0129457975' LIMIT 1);


INSERT IGNORE INTO users (ic, nama, telefon, role, status) VALUES
('S0199897719', 'MAHAROM BINTI OSMAN', '0199897719', 'student', 'aktif'),
('S0139105798', 'ASIAH BINTI MOHD', '0139105798', 'student', 'aktif'),
('S0179637770', 'ASIAH BINTI SULAIMAN', '0179637770', 'student', 'aktif'),
('S0139832558', 'HAFIDA BINTI MOHD ZAIN', '0139832558', 'student', 'aktif'),
('S0182468337', 'SARINAH BINTI ABDULLAH', '0182468337', 'student', 'aktif'),
('S01139894904', 'FARIDAH BIN MANSOR', '01139894904', 'student', 'aktif'),
('S0129605388', 'KHAMSIAH BT ABD AZIZ', '0129605388', 'student', 'aktif'),
('S01127181594', 'SHRIPAH RAHANI BINTI SYED DRAHIM', '01127181594', 'student', 'aktif'),
('S0176675855', 'AZMIAH BINTI MAKHTAR', '0176675855', 'student', 'aktif')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), telefon=VALUES(telefon), role=VALUES(role), status=VALUES(status);


INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES
('S0199897719', @kelas_syafie_id, '2025-02-06'),
('S0139105798', @kelas_syafie_id, '2025-02-06'),
('S0179637770', @kelas_syafie_id, '2025-02-06'),
('S0139832558', @kelas_syafie_id, '2025-02-06'),
('S0182468337', @kelas_syafie_id, '2025-02-06'),
('S01139894904', @kelas_syafie_id, '2025-02-06'),
('S0129605388', @kelas_syafie_id, '2025-02-06'),
('S01127181594', @kelas_syafie_id, '2025-02-06'),
('S0176675855', @kelas_syafie_id, '2025-02-06')
ON DUPLICATE KEY UPDATE kelas_id=VALUES(kelas_id), tarikh_daftar=VALUES(tarikh_daftar);








CREATE TABLE IF NOT EXISTS memo_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  content TEXT,
  created_by_ic VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dates (start_date, end_date)
);


ALTER TABLE campus_life_items ADD COLUMN IF NOT EXISTS category VARCHAR(50) NULL;





















UPDATE classes SET guru_ic = '7105150605193' WHERE guru_ic = '710515-06-5193';



UPDATE classes SET guru_ic = '9311290605047' WHERE guru_ic = 'T01111015704';



UPDATE classes SET guru_ic = '9203120605113' WHERE guru_ic = 'T0199165897';



UPDATE classes SET guru_ic = '7011080605175' WHERE guru_ic = 'T0199706272';



UPDATE classes SET guru_ic = '9512200605759' WHERE guru_ic = 'T0139424413';



UPDATE classes SET guru_ic = '9901240605179' WHERE guru_ic = 'T01121621582';



UPDATE classes SET guru_ic = '9605050605909' WHERE guru_ic = 'T0199684539';



UPDATE classes SET guru_ic = '9112100605097' WHERE guru_ic = 'T0162457106';



UPDATE classes SET guru_ic = '7203230605059' WHERE guru_ic = 'T0199390972';






DELETE FROM users WHERE ic = '710515-06-5193' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T01111015704' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199165897' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199706272' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0139424413' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T01121621582' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199684539' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0162457106' AND role = 'teacher';
DELETE FROM users WHERE ic = 'T0199390972' AND role = 'teacher';




SELECT 
    u.ic,
    u.nama,
    u.telefon,
    u.status,
    COUNT(c.id) as total_classes,
    GROUP_CONCAT(c.nama_kelas SEPARATOR ', ') as classes
FROM users u
LEFT JOIN classes c ON u.ic = c.guru_ic
WHERE u.ic IN (
    '7105150605193', '9311290605047', '9203120605113', '7011080605175',
    '9512200605759', '9901240605179', '9605050605909', '9112100605097',
    '7203230605059'
)
GROUP BY u.ic, u.nama, u.telefon, u.status
ORDER BY u.nama;









CREATE TABLE IF NOT EXISTS notification_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) DEFAULT NULL,
    notification_id VARCHAR(120) NOT NULL COMMENT 'e.g. PENDING_APPROVAL-{ic}, FAILED_PAYMENT-{id}, RESULTS_READY-{id}',
    action ENUM('read', 'dismissed') DEFAULT 'read',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_notification (user_ic, notification_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_notification_id (notification_id),
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);








CREATE TABLE IF NOT EXISTS global_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date)
);


CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  tarikh DATE,
  hari VARCHAR(20),
  masa VARCHAR(50),
  guru_ic VARCHAR(20),
  status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_by_ic VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tarikh (tarikh),
  INDEX idx_guru (guru_ic)
);














CREATE TABLE IF NOT EXISTS staff_checkin_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_ic VARCHAR(20) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    distance_from_masjid DECIMAL(10, 2) NULL,
    result ENUM('outside_location', 'gps_unavailable', 'already_checked_in', 'error') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_ic (staff_ic),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_result (result)
);









DELETE FROM users WHERE role = 'admin';


INSERT IGNORE INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES
('920312065113', 'USTAZ AMIR HASIF BIN HATA', '$2a$12$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('951220065759', 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', '$2a$12$dzmNIzsRBST1EbjNDs75iOzLnWD54uKYeOscFH/eLPK6VC3g8bEve', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('941218075641', 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', '$2a$12$HSZI9YHc60OGQB53Q0e8Bu7FCjpLpqZ4WpngiMMu8ec5fQm/F4xlG', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);









USE masjid_app;


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'fpx';


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'duitnow_qr';


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'duitnow_request';


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'tng_ewallet';


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'boost';


UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'grabpay';


SELECT method_code, method_name, provider, config 
FROM payment_method_settings 
ORDER BY display_order;











USE masjid_app;





ALTER TABLE classes
ADD COLUMN IF NOT EXISTS level VARCHAR(50) AFTER nama_kelas,
ADD COLUMN IF NOT EXISTS sessions JSON AFTER jadual,
ADD COLUMN IF NOT EXISTS yuran DECIMAL(10,2) DEFAULT 0 AFTER sessions,
ADD COLUMN IF NOT EXISTS kapasiti INT DEFAULT 20 AFTER yuran,
ADD COLUMN IF NOT EXISTS status ENUM('aktif', 'tidak_aktif', 'penuh') DEFAULT 'aktif' AFTER kapasiti;













ALTER TABLE fees
MODIFY COLUMN status ENUM('Bayar', 'Belum Bayar', 'terbayar', 'tunggak', 'pending') DEFAULT 'Belum Bayar';


ALTER TABLE fees
ADD COLUMN IF NOT EXISTS tarikh_bayar DATE AFTER tarikh,
ADD COLUMN IF NOT EXISTS bulan VARCHAR(20) AFTER tarikh_bayar,
ADD COLUMN IF NOT EXISTS tahun INT AFTER bulan,
ADD COLUMN IF NOT EXISTS cara_bayar VARCHAR(50) AFTER tahun,
ADD COLUMN IF NOT EXISTS no_resit VARCHAR(50) AFTER cara_bayar;









ALTER TABLE results ADD COLUMN IF NOT EXISTS catatan TEXT AFTER slip_img;





































UPDATE classes SET level = 'Asas' WHERE level IS NULL;
UPDATE classes SET sessions = '[]' WHERE sessions IS NULL;
UPDATE classes SET yuran = 0 WHERE yuran IS NULL;
UPDATE classes SET kapasiti = 20 WHERE kapasiti IS NULL;
UPDATE classes SET status = 'aktif' WHERE status IS NULL;

















ALTER TABLE user_roles 
MODIFY COLUMN role ENUM('admin', 'teacher', 'student', 'pic', 'staff', 'ib') NOT NULL;










SET FOREIGN_KEY_CHECKS = 0;



SELECT 'BEFORE DELETION - Invalid ICs found:' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'  
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)  
ORDER BY ic;










DELETE FROM staff_checkin 
WHERE staff_ic LIKE 'T0%' 
   OR staff_ic REGEXP '^[^0-9]'
   OR (staff_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(staff_ic, '-', '')) != 12);


DELETE FROM user_roles 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);


DELETE FROM fees 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);


DELETE FROM results 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);


DELETE FROM attendance 
WHERE student_ic LIKE 'T0%' 
   OR student_ic REGEXP '^[^0-9]'
   OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);


UPDATE classes 
SET guru_ic = NULL 
WHERE guru_ic LIKE 'T0%' 
   OR guru_ic REGEXP '^[^0-9]'
   OR (guru_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(guru_ic, '-', '')) != 12);


DELETE FROM teachers 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);


DELETE FROM students 
WHERE user_ic LIKE 'T0%' 
   OR user_ic REGEXP '^[^0-9]'
   OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);


DELETE FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12);

SET FOREIGN_KEY_CHECKS = 1;


SELECT 'AFTER DELETION - Remaining invalid ICs:' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;


SELECT 
    'STATISTICS' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN ic LIKE 'T0%' THEN 1 END) as remaining_t0_ics,
    COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format,
    COUNT(CASE WHEN LENGTH(REPLACE(ic, '-', '')) = 12 AND ic REGEXP '^[0-9]' THEN 1 END) as valid_12_digit_ics
FROM users;

SELECT 'Cleanup completed!' as status;









SET FOREIGN_KEY_CHECKS = 0;


SELECT 'BEFORE: Invalid ICs to be removed' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;


DELETE FROM staff_checkin WHERE staff_ic LIKE 'T0%' OR staff_ic REGEXP '^[^0-9]' OR (staff_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(staff_ic, '-', '')) != 12);
DELETE FROM user_roles WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM fees WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
DELETE FROM results WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
DELETE FROM attendance WHERE student_ic LIKE 'T0%' OR student_ic REGEXP '^[^0-9]' OR (student_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(student_ic, '-', '')) != 12);
UPDATE classes SET guru_ic = NULL WHERE guru_ic LIKE 'T0%' OR guru_ic REGEXP '^[^0-9]' OR (guru_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(guru_ic, '-', '')) != 12);
DELETE FROM teachers WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM students WHERE user_ic LIKE 'T0%' OR user_ic REGEXP '^[^0-9]' OR (user_ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(user_ic, '-', '')) != 12);
DELETE FROM users WHERE ic LIKE 'T0%' OR ic REGEXP '^[^0-9]' OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12);

SET FOREIGN_KEY_CHECKS = 1;


SELECT 'AFTER: Remaining invalid ICs (should be empty)' as info;
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
ORDER BY ic;


SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format_ics,
    COUNT(CASE WHEN ic LIKE 'T0%' THEN 1 END) as remaining_t0_ics
FROM users;

SELECT 'Cleanup completed!' as status;



SET FOREIGN_KEY_CHECKS=1;
