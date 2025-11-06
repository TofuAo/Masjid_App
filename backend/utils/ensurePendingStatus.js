import { pool } from '../config/database.js';

/**
 * Ensures the 'pending' status exists in the users table status ENUM
 * This is required for the registration approval queue system
 */
export const ensurePendingStatus = async () => {
  try {
    // Check current status column definition
    const [columns] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'status'
    `);

    if (columns && columns.length > 0) {
      const columnType = columns[0].COLUMN_TYPE;
      
      // Check if 'pending' is already in the ENUM
      if (!columnType.includes("'pending'")) {
        // Add 'pending' to the ENUM
        await pool.execute(`
          ALTER TABLE users 
          MODIFY COLUMN status ENUM('aktif','tidak_aktif','cuti','pending') DEFAULT 'pending'
        `);
        console.log('✓ Added "pending" to users.status ENUM');
      } else {
        console.log('✓ Users.status ENUM already includes "pending"');
      }
    }
  } catch (error) {
    // If column doesn't exist or other error, log but don't fail
    if (error.code !== 'ER_BAD_FIELD_ERROR') {
      console.error('Error ensuring pending status:', error.message);
      throw error;
    }
  }
};

