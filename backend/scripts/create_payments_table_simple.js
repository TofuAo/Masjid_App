import { pool } from '../config/database.js';

async function createPaymentsTable() {
  try {
    console.log('Creating payments table...');
    
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
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Table already exists, checking if we need to update enums...');
      try {
        await pool.execute(`
          ALTER TABLE payments 
          MODIFY COLUMN provider ENUM('ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct', 'toyyibpay') NOT NULL
        `);
        await pool.execute(`
          ALTER TABLE payments 
          MODIFY COLUMN method ENUM('fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay', 'toyyibpay')
        `);
        console.log('✅ Updated enums to include toyyibpay');
      } catch (e) {
        console.log('Enums may already be updated:', e.message);
      }
    }
    process.exit(0);
  }
}

createPaymentsTable();

