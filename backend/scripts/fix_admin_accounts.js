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

const admins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

async function fixAdminAccounts() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    // Check existing admins
    const [existingAdmins] = await connection.execute(
      "SELECT ic, nama, role, status FROM users WHERE role = 'admin'"
    );
    console.log(`\nFound ${existingAdmins.length} existing admin(s):`);
    existingAdmins.forEach(admin => {
      console.log(`  - ${admin.nama} (IC: ${admin.ic}, Status: ${admin.status})`);
    });

    // Ensure each admin exists with correct password
    for (const admin of admins) {
      console.log(`\nProcessing admin: ${admin.nama} (IC: ${admin.ic})`);
      
      // Check if admin exists (try both hyphenated and non-hyphenated formats)
      const [users] = await connection.execute(
        `SELECT ic, nama, password, role, status FROM users 
         WHERE REPLACE(ic, '-', '') = ?`,
        [admin.ic]
      );

      const hashedPassword = await bcrypt.hash(admin.password, 12);

      if (users.length > 0) {
        // Admin exists - update password and ensure status is 'aktif'
        const existingUser = users[0];
        console.log(`  Found existing admin with IC: ${existingUser.ic}`);
        
        // Verify current password
        const passwordMatch = await bcrypt.compare(admin.password, existingUser.password);
        if (passwordMatch) {
          console.log(`  ✅ Password already correct`);
        } else {
          console.log(`  ⚠️ Password incorrect, updating...`);
        }

        await connection.execute(
          `UPDATE users 
           SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
           WHERE REPLACE(ic, '-', '') = ?`,
          [admin.nama, hashedPassword, admin.ic]
        );
        console.log(`  ✅ Updated admin: ${admin.nama}`);
      } else {
        // Admin doesn't exist - create it
        await connection.execute(
          `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
           VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [admin.ic, admin.nama, hashedPassword]
        );
        console.log(`  ✅ Created admin: ${admin.nama}`);
      }
    }

    // Verify all admins are set up correctly
    console.log('\n✅ Verifying admin accounts...');
    for (const admin of admins) {
      const [users] = await connection.execute(
        `SELECT ic, nama, password, role, status FROM users 
         WHERE REPLACE(ic, '-', '') = ? AND role = 'admin'`,
        [admin.ic]
      );

      if (users.length > 0) {
        const user = users[0];
        const passwordMatch = await bcrypt.compare(admin.password, user.password);
        console.log(`  ✅ ${admin.nama} (IC: ${user.ic}): Status=${user.status}, Password=${passwordMatch ? 'Correct' : 'INCORRECT'}`);
      } else {
        console.log(`  ❌ ${admin.nama}: NOT FOUND`);
      }
    }

    console.log('\n✅ Admin accounts fix completed successfully!');
    console.log('\n📋 Login credentials:');
    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. IC: ${admin.ic} (or ${admin.ic.substring(0, 6)}-${admin.ic.substring(6, 8)}-${admin.ic.substring(8)})`);
      console.log(`     Password: ${admin.password}`);
      console.log(`     Name: ${admin.nama}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdminAccounts();

