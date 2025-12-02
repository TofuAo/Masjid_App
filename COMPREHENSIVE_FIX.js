// Comprehensive Fix Script for Login and Website Functions
// This script will:
// 1. Verify database connection
// 2. Create/update admin accounts with correct passwords
// 3. Test login functionality
// 4. Verify all connections work

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307, // Docker mapped port
  user: process.env.DB_USER || 'masjid_user',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
};

const admins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

async function comprehensiveFix() {
  let connection;
  try {
    console.log('🔧 COMPREHENSIVE FIX FOR LOGIN AND WEBSITE FUNCTIONS\n');
    console.log('='.repeat(60));

    // Step 1: Test Database Connection
    console.log('\n📊 Step 1: Testing Database Connection...');
    try {
      connection = await mysql.createConnection(connectionConfig);
      console.log('✅ Database connection successful');
      
      const [result] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Found ${result[0].count} users in database`);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('   Make sure MySQL container is running: docker-compose ps mysql');
      process.exit(1);
    }

    // Step 2: Create/Update Admin Accounts
    console.log('\n👤 Step 2: Creating/Updating Admin Accounts...');
    for (const admin of admins) {
      try {
        // Check if admin exists
        const [users] = await connection.execute(
          `SELECT ic, nama, password, role, status FROM users 
           WHERE REPLACE(ic, '-', '') = ?`,
          [admin.ic]
        );

        const hashedPassword = await bcrypt.hash(admin.password, 12);

        if (users.length > 0) {
          // Admin exists - verify and update if needed
          const existingUser = users[0];
          const passwordMatch = await bcrypt.compare(admin.password, existingUser.password);

          if (!passwordMatch || existingUser.status !== 'aktif' || existingUser.role !== 'admin') {
            await connection.execute(
              `UPDATE users 
               SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
               WHERE REPLACE(ic, '-', '') = ?`,
              [admin.nama, hashedPassword, admin.ic]
            );
            console.log(`  ✅ Updated admin: ${admin.nama}`);
          } else {
            console.log(`  ✅ Admin verified: ${admin.nama}`);
          }
        } else {
          // Admin doesn't exist - create it
          await connection.execute(
            `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
             VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [admin.ic, admin.nama, hashedPassword]
          );
          console.log(`  ✅ Created admin: ${admin.nama}`);
        }

        // Verify password works
        const [verifyUsers] = await connection.execute(
          `SELECT password FROM users WHERE REPLACE(ic, '-', '') = ?`,
          [admin.ic]
        );
        const verifyMatch = await bcrypt.compare(admin.password, verifyUsers[0].password);
        if (!verifyMatch) {
          console.error(`  ❌ Password verification failed for ${admin.nama}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing admin ${admin.nama}:`, error.message);
      }
    }

    // Step 3: Verify Admin Accounts
    console.log('\n🔍 Step 3: Verifying Admin Accounts...');
    for (const admin of admins) {
      const [users] = await connection.execute(
        `SELECT ic, nama, role, status FROM users 
         WHERE REPLACE(ic, '-', '') = ? AND role = 'admin' AND status = 'aktif'`,
        [admin.ic]
      );

      if (users.length > 0) {
        console.log(`  ✅ ${admin.nama}`);
        console.log(`     IC: ${users[0].ic}`);
        console.log(`     Status: ${users[0].status}`);
      } else {
        console.error(`  ❌ ${admin.nama} - NOT FOUND OR INACTIVE`);
      }
    }

    // Step 4: Test Backend Health
    console.log('\n🏥 Step 4: Testing Backend Health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Uptime: ${Math.round(healthResponse.data.uptime)}s`);
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      console.error('   Make sure backend is running: docker-compose ps backend');
      console.error('   Start backend: docker-compose up -d backend');
    }

    // Step 5: Test Login API
    console.log('\n🔐 Step 5: Testing Login API...');
    const testAdmin = admins[0];
    try {
      const loginResponse = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          icNumber: testAdmin.ic,
          password: testAdmin.password,
        },
        { timeout: 10000 }
      );

      if (loginResponse.data.success && loginResponse.data.data.token) {
        console.log('✅ Login API test successful!');
        console.log(`   User: ${loginResponse.data.data.user.nama}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}`);
        console.log(`   Token received: ${loginResponse.data.data.token.substring(0, 30)}...`);
      } else {
        console.error('❌ Login API returned unexpected format');
        console.error('   Response:', JSON.stringify(loginResponse.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Login API test failed');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Message: ${error.response.data?.message || 'Unknown error'}`);
        console.error(`   Full response:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log('\n✅ Admin accounts have been created/verified');
    console.log('\n📝 Login Credentials:');
    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.nama}`);
      console.log(`   IC: ${admin.ic} (or ${admin.ic.substring(0, 6)}-${admin.ic.substring(6, 8)}-${admin.ic.substring(8)})`);
      console.log(`   Password: ${admin.password}`);
    });

    console.log('\n🌐 Next Steps:');
    console.log('1. Make sure backend is running: docker-compose ps backend');
    console.log('2. If not running, start it: docker-compose up -d backend');
    console.log('3. Wait 10 seconds for backend to start');
    console.log('4. Try logging in at http://localhost:3000');
    console.log('5. Use IC: 920312065113, Password: Amir920313');

    console.log('\n✅ Comprehensive fix completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Comprehensive fix failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

comprehensiveFix();

