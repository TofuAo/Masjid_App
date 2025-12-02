// Ensure IB role exists in users table
// Only one user can have the IB role at a time

import { pool } from '../config/database.js';

export async function ensureIbRole() {
  try {
    // Check if IB role exists in the role ENUM
    const [columns] = await pool.execute(
      `SELECT COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'role'`
    );

    if (columns.length > 0) {
      const columnType = columns[0].COLUMN_TYPE;
      if (!columnType.includes("'ib'")) {
        // Add IB role to ENUM
        await pool.execute(
          `ALTER TABLE users 
           MODIFY COLUMN role ENUM('student','teacher','admin','pic','staff','ib') NOT NULL DEFAULT 'student'`
        );
        console.log('✅ IB role added to users table');
      }
    }

    // Ensure payment_confirmations table exists
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'payment_confirmations'`
    );

    if (tables.length === 0) {
      await pool.execute(`
        CREATE TABLE payment_confirmations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bulan VARCHAR(20) NOT NULL,
          tahun INT NOT NULL,
          confirmed_by_ic VARCHAR(20) NOT NULL,
          confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          confirmation_period_start DATE NOT NULL,
          confirmation_period_end DATE NOT NULL,
          status ENUM('pending','confirmed','rejected') DEFAULT 'pending',
          notes TEXT,
          total_payments INT DEFAULT 0,
          total_amount DECIMAL(10,2) DEFAULT 0.00,
          verified_payments INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (confirmed_by_ic) REFERENCES users(ic) ON DELETE CASCADE,
          UNIQUE KEY unique_month_year (bulan, tahun)
        )
      `);
      console.log('✅ payment_confirmations table created');
    }

    console.log('✅ IB role and payment confirmation system verified');
  } catch (error) {
    console.error('❌ Failed to ensure IB role:', error.message);
    // Don't throw - allow server to start even if this fails
  }
}

