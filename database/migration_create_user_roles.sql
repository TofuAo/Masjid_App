-- Migration: Create table to store additional roles per user
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_ic VARCHAR(20) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'pic', 'staff', 'ib') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_ic, role),
  FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);

