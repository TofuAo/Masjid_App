-- Dynamic class change feature: exam-only assignment and audit log
-- Run once. Safe to re-run (uses IF NOT EXISTS / checks for columns).

-- Add optional exam class columns to students (temporary exam assignment)
-- Note: Run ensureClassChangeTables.js on server start, or run these manually once:
-- ALTER TABLE students ADD COLUMN exam_class_id INT NULL COMMENT 'Temporary exam class';
-- ALTER TABLE students ADD COLUMN exam_class_end_date DATE NULL COMMENT 'When exam assignment ends';

-- Optional FK (uncomment if desired):
-- ALTER TABLE students ADD CONSTRAINT fk_students_exam_class FOREIGN KEY (exam_class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Audit log for every class change (admin actions)
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
