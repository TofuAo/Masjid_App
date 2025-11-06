import { pool } from '../config/database.js';

/**
 * Ensures the staff_checkin table exists with all required columns
 * This is called on server startup to ensure database schema is up to date
 */
export const ensureCheckInTable = async () => {
  try {
    console.log('Checking/creating staff_checkin table...');
    // Check if table exists
    const [tables] = await pool.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'staff_checkin'`
    );

    if (tables[0].count === 0) {
      console.log('Creating staff_checkin table...');
      
      // Create table
      await pool.execute(`
        CREATE TABLE staff_checkin (
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
        )
      `);
      
      console.log('✓ staff_checkin table created successfully');
    } else {
      // Check if shift_type column exists
      const [columns] = await pool.execute(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'staff_checkin' 
        AND column_name = 'shift_type'
      `);

      if (columns[0].count === 0) {
        console.log('Adding shift_type column to staff_checkin table...');
        await pool.execute(`
          ALTER TABLE staff_checkin 
          ADD COLUMN shift_type ENUM('normal', 'shift') DEFAULT 'normal' AFTER distance_from_masjid
        `);
        await pool.execute(`
          CREATE INDEX IF NOT EXISTS idx_shift_type ON staff_checkin(shift_type)
        `);
        console.log('✓ shift_type column added successfully');
      }
    }

    // Ensure masjid location settings exist
    const [settings] = await pool.execute(`
      SELECT setting_key FROM settings 
      WHERE setting_key IN ('masjid_latitude', 'masjid_longitude', 'masjid_checkin_radius')
    `);

    const existingKeys = settings.map(s => s.setting_key);
    
    if (!existingKeys.includes('masjid_latitude')) {
      await pool.execute(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description)
        VALUES ('masjid_latitude', '3.807829297637092', 'text', 'Masjid latitude coordinate for geolocation check-in')
      `);
    }
    
    if (!existingKeys.includes('masjid_longitude')) {
      await pool.execute(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description)
        VALUES ('masjid_longitude', '103.32799643765418', 'text', 'Masjid longitude coordinate for geolocation check-in')
      `);
    }
    
    if (!existingKeys.includes('masjid_checkin_radius')) {
      await pool.execute(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description)
        VALUES ('masjid_checkin_radius', '100', 'text', 'Maximum allowed distance from masjid for check-in (in meters)')
      `);
    }

    console.log('✓ Check-in table and settings verified');
    return true;
  } catch (error) {
    console.error('Error ensuring check-in table:', error);
    return false;
  }
};

