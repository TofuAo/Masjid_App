import { pool } from './config/database.js';

async function patchDatabase() {
  try {
    console.log('Running database patches...');

    // 1. Fix users table
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN preferences JSON NULL;`);
      console.log('✅ Added preferences to users table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ preferences already exists in users');
      else throw e;
    }

    // 2. Fix attendance table
    try {
      await pool.query(`
        ALTER TABLE attendance
        ADD COLUMN document_confirmed TINYINT(1) DEFAULT 0,
        ADD COLUMN confirmed_by VARCHAR(20),
        ADD COLUMN confirmed_at DATETIME,
        ADD COLUMN confirmation_notes TEXT;
      `);
      console.log('✅ Added confirmation columns to attendance table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ confirmation columns already exist in attendance');
      else throw e;
    }

    // 3. Fix fees table
    try {
      await pool.query(`
        ALTER TABLE fees
        ADD COLUMN document_confirmed TINYINT(1) DEFAULT 0,
        ADD COLUMN confirmed_by VARCHAR(20),
        ADD COLUMN confirmed_at DATETIME;
      `);
      console.log('✅ Added confirmation columns to fees table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ confirmation columns already exist in fees');
      else throw e;
    }

    // 4. Fix missing payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status VARCHAR(50),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created payments table');

    console.log('🎉 Database patched successfully!');
  } catch (error) {
    console.error('❌ Error patching database:', error);
  } finally {
    process.exit();
  }
}

patchDatabase();
