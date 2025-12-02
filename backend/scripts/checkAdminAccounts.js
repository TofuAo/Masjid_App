import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const expectedAdmins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

async function checkAdminAccounts() {
  try {
    console.log('='.repeat(80));
    console.log('ADMIN ACCOUNTS DATABASE CHECK');
    console.log('='.repeat(80));
    console.log('');

    // Get all admin accounts from database
    const [allAdmins] = await pool.execute(
      `SELECT ic, nama, password, role, status FROM users WHERE role = 'admin' ORDER BY nama`
    );

    console.log(`📊 Total Admin Accounts in Database: ${allAdmins.length}\n`);

    if (allAdmins.length === 0) {
      console.log('❌ NO ADMIN ACCOUNTS FOUND IN DATABASE!\n');
      console.log('Expected admin accounts:');
      expectedAdmins.forEach(admin => {
        console.log(`  - IC: ${admin.ic}, Name: ${admin.nama}`);
      });
      process.exit(1);
    }

    // Display all admin accounts
    console.log('📋 Admin Accounts in Database:');
    console.log('-'.repeat(80));
    for (const admin of allAdmins) {
      const normalizedIC = admin.ic.replace(/[-\s]/g, '');
      const passwordStatus = admin.password ? 
        (admin.password.startsWith('$2') ? '✅ HASHED' : '⚠️ NOT HASHED') : 
        '❌ NO PASSWORD';
      const passwordLength = admin.password ? admin.password.length : 0;
      
      console.log(`\n👤 Name: ${admin.nama}`);
      console.log(`   IC: ${admin.ic} (normalized: ${normalizedIC})`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Password: ${passwordStatus} (length: ${passwordLength})`);
      
      // Check if this matches expected admin
      const expected = expectedAdmins.find(a => a.ic === normalizedIC);
      if (expected) {
        console.log(`   ✅ Matches expected admin: ${expected.nama}`);
        
        // Test password
        if (admin.password && admin.password.startsWith('$2')) {
          const passwordMatch = await bcrypt.compare(expected.password, admin.password);
          console.log(`   Password Test: ${passwordMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
          if (!passwordMatch) {
            console.log(`   ⚠️  Password mismatch! Expected: "${expected.password}"`);
          }
        } else {
          console.log(`   ⚠️  Password not hashed - needs to be fixed`);
        }
      } else {
        console.log(`   ⚠️  Not in expected admin list`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('EXPECTED ADMIN ACCOUNTS:');
    console.log('='.repeat(80));
    expectedAdmins.forEach(admin => {
      console.log(`\n👤 ${admin.nama}`);
      console.log(`   IC: ${admin.ic}`);
      console.log(`   Password: ${admin.password}`);
    });

    // Check for missing expected admins
    console.log('\n' + '='.repeat(80));
    console.log('MISSING ADMIN ACCOUNTS CHECK:');
    console.log('='.repeat(80));
    let allFound = true;
    for (const expected of expectedAdmins) {
      const found = allAdmins.find(a => a.ic.replace(/[-\s]/g, '') === expected.ic);
      if (!found) {
        console.log(`❌ MISSING: ${expected.nama} (IC: ${expected.ic})`);
        allFound = false;
      }
    }
    if (allFound) {
      console.log('✅ All expected admin accounts are present in database');
    }

    console.log('\n' + '='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin accounts:', error);
    process.exit(1);
  }
}

checkAdminAccounts();

