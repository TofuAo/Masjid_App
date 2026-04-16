-- ============================================================
-- CLASS ASSIGNMENTS DESIGN (MySQL)
-- Safe migration style — run ensure script on server start, or run manually once.
-- ============================================================

-- 1. CLASS_ASSIGNMENTS (many-to-many: students ↔ classes, with type & dates)
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

-- 2. EXAM_SESSIONS
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_es_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ADMIN_LOGS (generic action log)
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

-- 4. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_perm (role, permission_code),
    INDEX idx_rp_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed permissions
INSERT IGNORE INTO permissions (code, description) VALUES
('class.view', 'View class list'),
('class.change', 'Change student class'),
('class.exam.assign', 'Assign exam class'),
('class.rollback', 'Undo class change');

-- Seed role_permissions: admin gets all
INSERT IGNORE INTO role_permissions (role, permission_code)
SELECT 'admin', code FROM permissions WHERE code LIKE 'class.%';
INSERT IGNORE INTO role_permissions (role, permission_code)
SELECT 'staff', code FROM permissions WHERE code LIKE 'class.%';
INSERT IGNORE INTO role_permissions (role, permission_code)
VALUES ('teacher', 'class.view');
