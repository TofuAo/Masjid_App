import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationSQL = `
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'image', 'link', 'json') DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('qr_code_image', NULL, 'image', 'QR Code image file path or URL for payment page'),
    ('qr_code_link', NULL, 'link', 'Alternative: QR Code link/URL for payment page'),
    ('qr_code_enabled', '1', 'text', 'Enable custom QR code (1=enabled, 0=disabled, uses auto-generated QR)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
`;

async function runMigration() {
  try {
    console.log('Running settings table migration...');
    
    // Split SQL by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    // If table already exists, that's okay
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Settings table already exists, skipping creation.');
      process.exit(0);
    }
    process.exit(1);
  }
}

runMigration();

