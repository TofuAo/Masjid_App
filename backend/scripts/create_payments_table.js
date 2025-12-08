import { pool } from '../config/database.js';

async function createPaymentsTable() {
  try {
    console.log('Checking if payments table exists...');
    
    // Check if table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'payments'");
    
    if (tables.length > 0) {
      console.log('✅ Payments table already exists');
      
      // Check if toyyibpay is in the provider enum
      const [columns] = await pool.execute("SHOW COLUMNS FROM payments WHERE Field = 'provider'");
      if (columns.length > 0) {
        const columnDef = columns[0].Type;
        if (!columnDef.includes('toyyibpay')) {
          console.log('Updating provider enum to include toyyibpay...');
          await pool.execute(`
            ALTER TABLE payments 
            MODIFY COLUMN provider ENUM('ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct', 'toyyibpay') NOT NULL
          `);
          console.log('✅ Provider enum updated to include toyyibpay');
        }
      }
      
      // Check if method column supports toyyibpay
      const [methodColumns] = await pool.execute("SHOW COLUMNS FROM payments WHERE Field = 'method'");
      if (methodColumns.length > 0) {
        const methodDef = methodColumns[0].Type;
        if (!methodDef.includes('toyyibpay')) {
          console.log('Updating method enum to include toyyibpay...');
          await pool.execute(`
            ALTER TABLE payments 
            MODIFY COLUMN method ENUM('fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay', 'toyyibpay')
          `);
          console.log('✅ Method enum updated to include toyyibpay');
        }
      }
      
      process.exit(0);
      return;
    }
    
    console.log('Creating payments table...');
    
    // Create the payments table with toyyibpay support
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_ic VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'MYR',
        method ENUM('fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay', 'toyyibpay'),
        provider ENUM('ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct', 'toyyibpay') NOT NULL,
        provider_reference VARCHAR(255),
        status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired') DEFAULT 'pending',
        proof_url VARCHAR(500),
        metadata JSON,
        idempotency_key VARCHAR(255) UNIQUE,
        webhook_received BOOLEAN DEFAULT FALSE,
        webhook_data JSON,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_ic (user_ic),
        INDEX idx_status (status),
        INDEX idx_provider_reference (provider_reference),
        INDEX idx_idempotency_key (idempotency_key),
        INDEX idx_created_at (created_at)
      )
    `);
    
    console.log('✅ Payments table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating payments table:', error);
    process.exit(1);
  }
}

createPaymentsTable();

