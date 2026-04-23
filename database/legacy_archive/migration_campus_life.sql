-- Campus Life & Executive Approval
-- Items submitted by teachers, approved/rejected by executives (admins)

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
