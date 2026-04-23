-- Migration 03 — Admin Logs (MySQL)
-- JSON column for details (MySQL 5.7+).

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
