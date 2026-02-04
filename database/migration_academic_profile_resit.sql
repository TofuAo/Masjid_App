-- Academic Profile & Resit: class_track, academic_bio, cover_photo, resit_applications
-- Run this migration to add Facebook-style profile and resit support.

-- 1. Users: add cover_photo (run once; ignore error if column already exists)
ALTER TABLE users ADD COLUMN cover_photo VARCHAR(255) DEFAULT NULL;

-- 2. Students: add class_track and academic_bio
ALTER TABLE students ADD COLUMN class_track VARCHAR(50) DEFAULT NULL COMMENT 'Full-Time, Part-Time, Online';
ALTER TABLE students ADD COLUMN academic_bio VARCHAR(255) DEFAULT NULL;

-- 3. Resit applications (eligible = markah < 40, status: eligible|applied|confirmed)
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
