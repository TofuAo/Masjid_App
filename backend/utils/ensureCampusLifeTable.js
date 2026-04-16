import { pool } from '../config/database.js';

const createTableSQL = `
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
  INDEX idx_status (status),
  INDEX idx_created_by (created_by_ic),
  INDEX idx_tarikh (tarikh)
)
`;
// Note: FK to users(ic) omitted for compatibility; add manually if needed

export async function ensureCampusLifeTable() {
  try {
    await pool.execute(createTableSQL);
    console.log('✅ campus_life_items table ensured');
    return true;
  } catch (err) {
    console.error('❌ Failed to ensure campus_life_items table:', err.message);
    throw err;
  }
}
