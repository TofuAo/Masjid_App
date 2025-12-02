import { pool } from '../config/database.js';

const ibIC = '731014065251';

try {
  // Check if user_roles table exists, if not create it
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_ic VARCHAR(20) NOT NULL,
        role ENUM('admin', 'teacher', 'student', 'pic', 'staff', 'ib') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_role (user_ic, role),
        FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
      )
    `);
    console.log('user_roles table checked/created');
  } catch (error) {
    console.log('user_roles table already exists or error:', error.message);
  }

  // Add admin role to IB user
  try {
    await pool.execute(
      `INSERT INTO user_roles (user_ic, role) 
       VALUES (?, 'admin')
       ON DUPLICATE KEY UPDATE role = 'admin'`,
      [ibIC]
    );
    console.log('Admin role added to IB user successfully!');
  } catch (error) {
    console.error('Error adding admin role:', error.message);
  }

  // Verify
  const [roles] = await pool.execute(
    'SELECT role FROM user_roles WHERE user_ic = ?',
    [ibIC]
  );
  
  const [user] = await pool.execute(
    'SELECT ic, nama, role FROM users WHERE ic = ?',
    [ibIC]
  );

  console.log('\nIB User Roles:');
  console.log('Primary Role:', user[0]?.role);
  console.log('Additional Roles:', roles.map(r => r.role).join(', '));
  console.log('\nIB user can now login as:');
  console.log('- IB (Pengesah Pembayaran)');
  console.log('- Pentadbir (Admin Sistem)');
  
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

