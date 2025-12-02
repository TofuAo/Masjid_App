// Quick fix script to create admin account
// Run: node quick-fix-admin.js

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connectionConfig = {
  host: 'localhost',
  port: 3307, // Docker mapped port
  user: 'masjid_user',
  password: 'masjid_password',
  database: 'masjid_app',
};

async function fixAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    const ic = '920312065113';
    const password = 'Amir920313';
    const nama = 'USTAZ AMIR HASIF BIN HATA';

    // Generate fresh password hash
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Generated password hash');

    // Delete existing user if exists
    await connection.execute(
      `DELETE FROM users WHERE REPLACE(ic, '-', '') = ?`,
      [ic]
    );
    console.log('✅ Deleted existing user (if any)');

    // Insert new admin
    await connection.execute(
      `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [ic, nama, hashedPassword]
    );
    console.log('✅ Created admin account');

    // Verify
    const [users] = await connection.execute(
      `SELECT ic, nama, role, status FROM users WHERE REPLACE(ic, '-', '') = ?`,
      [ic]
    );

    if (users.length > 0) {
      console.log('\n✅ Admin account verified:');
      console.log(`   IC: ${users[0].ic}`);
      console.log(`   Name: ${users[0].nama}`);
      console.log(`   Role: ${users[0].role}`);
      console.log(`   Status: ${users[0].status}`);
      
      // Test password
      const [userWithPassword] = await connection.execute(
        `SELECT password FROM users WHERE REPLACE(ic, '-', '') = ?`,
        [ic]
      );
      const passwordMatch = await bcrypt.compare(password, userWithPassword[0].password);
      console.log(`   Password verification: ${passwordMatch ? '✅ VALID' : '❌ INVALID'}`);
    }

    console.log('\n✅ Done! You can now login with:');
    console.log(`   IC: ${ic} (or ${ic.substring(0, 6)}-${ic.substring(6, 8)}-${ic.substring(8)})`);
    console.log(`   Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdmin();

