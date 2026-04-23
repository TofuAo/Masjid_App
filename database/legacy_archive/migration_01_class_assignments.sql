-- Migration 01 — Class Assignments (MySQL)
-- Run once. Tables are also ensured by backend/utils/ensureClassAssignmentsDesign.js on server start.

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
