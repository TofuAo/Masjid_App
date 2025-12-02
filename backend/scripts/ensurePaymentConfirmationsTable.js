import { pool } from '../config/database.js';

try {
  // Check if table exists
  const [tables] = await pool.execute(
    "SHOW TABLES LIKE 'payment_confirmations'"
  );

  if (tables.length === 0) {
    console.log('Creating payment_confirmations table...');
    
    // Create payment_confirmations table
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

    // Create indexes
    await pool.execute(`
      CREATE INDEX idx_payment_confirmation_period 
      ON payment_confirmations(confirmation_period_start, confirmation_period_end)
    `);

    await pool.execute(`
      CREATE INDEX idx_payment_confirmation_status 
      ON payment_confirmations(status)
    `);

    console.log('✅ payment_confirmations table created successfully!');
  } else {
    console.log('✅ payment_confirmations table already exists');
  }

  // Verify table structure
  const [columns] = await pool.execute('DESCRIBE payment_confirmations');
  console.log('\nTable structure:');
  columns.forEach(col => {
    console.log(`  - ${col.Field}: ${col.Type}`);
  });

  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

