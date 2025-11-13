import { pool } from '../config/database.js';

/**
 * Ensures the users.role ENUM contains the 'pic' value so that
 * Person-In-Charge accounts can be persisted.
 */
export const ensurePicRole = async () => {
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role'
    `);

    if (!columns || columns.length === 0) {
      return;
    }

    const columnType = columns[0].COLUMN_TYPE;

    if (!columnType.includes("'pic'")) {
      // Preserve existing enum members and append 'pic'
      await pool.execute(`
        ALTER TABLE users
        MODIFY COLUMN role ENUM('student','teacher','admin','pic') NOT NULL DEFAULT 'student'
      `);
      console.log('✓ Added "pic" to users.role ENUM');
    } else {
      console.log('✓ Users.role ENUM already includes "pic"');
    }
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') {
      console.error('Error ensuring PIC role:', error.message);
      throw error;
    }
  }
};

