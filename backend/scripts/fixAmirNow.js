// Comprehensive fix for Amir's login account
import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const amirIC = '920312065113';
const amirNama = 'USTAZ AMIR HASIF BIN HATA';
const amirPassword = 'Amir920313';

async function fixAmirNow() {
  try {
    console.log('========================================');
    console.log('🔧 FIXING AMIR ACCOUNT');
    console.log('========================================\n');
    
    const normalizedIC = amirIC.replace(/[-\s]/g, '');
    console.log(`IC: ${amirIC} (normalized: ${normalizedIC})`);
    console.log(`Password: ${amirPassword}`);
    console.log(`Name: ${amirNama}\n`);
    
    // Step 1: Check existing accounts
    console.log('Step 1: Checking for existing accounts...');
    const [existing] = await pool.execute(
      `SELECT ic, nama, role, status, password IS NOT NULL as has_password 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    
    console.log(`Found ${existing.length} account(s)\n`);
    
    // Step 2: Hash password
    console.log('Step 2: Hashing password...');
    const hashedPassword = await bcrypt.hash(amirPassword, 12);
    console.log('✅ Password hashed\n');
    
    // Step 3: Delete all existing accounts with this IC
    if (existing.length > 0) {
      console.log('Step 3: Removing existing accounts...');
      const [deleteResult] = await pool.execute(
        `DELETE FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
        [normalizedIC]
      );
      console.log(`✅ Deleted ${deleteResult.affectedRows} account(s)\n`);
    }
    
    // Step 4: Create fresh account
    console.log('Step 4: Creating new account...');
    await pool.execute(
      `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [normalizedIC, amirNama, hashedPassword]
    );
    console.log('✅ Account created\n');
    
    // Step 5: Verify account
    console.log('Step 5: Verifying account...');
    const [verify] = await pool.execute(
      `SELECT ic, nama, role, status, password IS NOT NULL as has_password 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    
    if (verify.length > 0) {
      const user = verify[0];
      console.log('✅ Account verified:');
      console.log(`   IC: ${user.ic}`);
      console.log(`   Name: ${user.nama}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${user.has_password}\n`);
      
      // Step 6: Test password
      console.log('Step 6: Testing password...');
      const [pwdCheck] = await pool.execute(
        `SELECT password FROM users WHERE ic = ?`,
        [user.ic]
      );
      
      if (pwdCheck.length > 0 && pwdCheck[0].password) {
        const match = await bcrypt.compare(amirPassword, pwdCheck[0].password);
        console.log(`   Password Match: ${match ? '✅ YES' : '❌ NO'}\n`);
        
        if (!match) {
          console.log('⚠️  Password mismatch detected! Re-hashing...');
          const newHash = await bcrypt.hash(amirPassword, 12);
          await pool.execute(
            `UPDATE users SET password = ? WHERE ic = ?`,
            [newHash, user.ic]
          );
          const retest = await bcrypt.compare(amirPassword, newHash);
          console.log(`   Retest: ${retest ? '✅ YES' : '❌ NO'}\n`);
        }
      }
    } else {
      console.log('❌ Account not found after creation!\n');
    }
    
    await pool.end();
    
    console.log('========================================');
    console.log('✅ FIX COMPLETE!');
    console.log('========================================');
    console.log('\nLogin Credentials:');
    console.log(`   IC: ${amirIC} (or ${amirIC.substring(0,6)}-${amirIC.substring(6,8)}-${amirIC.substring(8)})`);
    console.log(`   Password: ${amirPassword}`);
    console.log(`   Role: Pentadbir (Admin)`);
    console.log('\nTry logging in now!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixAmirNow();

