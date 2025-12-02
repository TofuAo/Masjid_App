import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'masjid_user',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
};

async function verifyAdminLogin() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database\n');

    // Test IC: 920312065113 with password: Amir920313
    const testIC = '920312065113';
    const testPassword = 'Amir920313';

    console.log(`Testing login for IC: ${testIC}, Password: ${testPassword}\n`);

    // Find user with normalized IC
    const [users] = await connection.execute(
      `SELECT ic, nama, password, role, status FROM users 
       WHERE REPLACE(ic, '-', '') = ?`,
      [testIC]
    );

    if (users.length === 0) {
      console.log('❌ USER NOT FOUND in database!');
      console.log('\nChecking all admin accounts...');
      
      const [allAdmins] = await connection.execute(
        "SELECT ic, nama, role, status FROM users WHERE role = 'admin'"
      );
      
      if (allAdmins.length === 0) {
        console.log('❌ No admin accounts found in database!');
      } else {
        console.log(`Found ${allAdmins.length} admin(s):`);
        allAdmins.forEach(admin => {
          console.log(`  - IC: ${admin.ic}, Name: ${admin.nama}, Status: ${admin.status}`);
        });
      }
      
      console.log('\n🔧 Please run: docker-compose exec backend node scripts/fix_admin_accounts.js');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ User found:`);
    console.log(`   IC: ${user.ic}`);
    console.log(`   Name: ${user.nama}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...`);

    // Test password
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log(`\n🔐 Password verification: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);

    if (!isPasswordValid) {
      console.log('\n⚠️ Password mismatch! Updating password...');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      await connection.execute(
        `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE REPLACE(ic, '-', '') = ?`,
        [hashedPassword, testIC]
      );
      console.log('✅ Password updated!');
      
      // Verify again
      const [updatedUsers] = await connection.execute(
        `SELECT password FROM users WHERE REPLACE(ic, '-', '') = ?`,
        [testIC]
      );
      const newPasswordValid = await bcrypt.compare(testPassword, updatedUsers[0].password);
      console.log(`🔐 New password verification: ${newPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    if (user.status !== 'aktif') {
      console.log(`\n⚠️ User status is '${user.status}', should be 'aktif'. Updating...`);
      await connection.execute(
        `UPDATE users SET status = 'aktif', updated_at = CURRENT_TIMESTAMP 
         WHERE REPLACE(ic, '-', '') = ?`,
        [testIC]
      );
      console.log('✅ Status updated to aktif!');
    }

    console.log('\n✅ Login verification complete!');
    console.log('\n📋 You can now login with:');
    console.log(`   IC: ${user.ic} (or ${testIC.substring(0, 6)}-${testIC.substring(6, 8)}-${testIC.substring(8)})`);
    console.log(`   Password: ${testPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyAdminLogin();

