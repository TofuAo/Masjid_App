// Force fix Amir's account - direct database update
import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const amirIC = '920312065113';
const amirNama = 'USTAZ AMIR HASIF BIN HATA';
const amirPassword = 'Amir920313';

async function forceFixAmir() {
  try {
    console.log('🔧 FORCE FIXING AMIR ACCOUNT...\n');
    
    const normalizedIC = amirIC.replace(/[-\s]/g, '');
    console.log(`IC: ${amirIC} (normalized: ${normalizedIC})`);
    console.log(`Password: ${amirPassword}`);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(amirPassword, 12);
    console.log('Password hashed successfully');
    
    // Delete any existing accounts with this IC (to avoid duplicates)
    console.log('\nStep 1: Removing any duplicate accounts...');
    const [deleteResult] = await pool.execute(
      `DELETE FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    console.log(`Deleted ${deleteResult.affectedRows} existing account(s)`);
    
    // Create fresh account
    console.log('\nStep 2: Creating new account...');
    await pool.execute(
      `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [normalizedIC, amirNama, hashedPassword]
    );
    console.log('✅ Account created');
    
    // Verify account
    console.log('\nStep 3: Verifying account...');
    const [verify] = await pool.execute(
      `SELECT ic, nama, role, status, password IS NOT NULL as has_password 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    
    if (verify.length > 0) {
      const user = verify[0];
      console.log(`✅ Account verified:`);
      console.log(`   IC: ${user.ic}`);
      console.log(`   Name: ${user.nama}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${user.has_password}`);
      
      // Test password
      const [pwdCheck] = await pool.execute(
        `SELECT password FROM users WHERE ic = ?`,
        [user.ic]
      );
      
      if (pwdCheck.length > 0 && pwdCheck[0].password) {
        const match = await bcrypt.compare(amirPassword, pwdCheck[0].password);
        console.log(`   Password Test: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
        
        if (!match) {
          console.log('\n⚠️  Password mismatch! Re-hashing...');
          const newHash = await bcrypt.hash(amirPassword, 12);
          await pool.execute(
            `UPDATE users SET password = ? WHERE ic = ?`,
            [newHash, user.ic]
          );
          const retest = await bcrypt.compare(amirPassword, newHash);
          console.log(`   Retest: ${retest ? '✅ MATCH' : '❌ NO MATCH'}`);
        }
      }
    } else {
      console.log('❌ Account not found after creation!');
    }
    
    await pool.end();
    console.log('\n✅ FORCE FIX COMPLETE!');
    console.log(`\nLogin with:`);
    console.log(`   IC: ${amirIC} or ${amirIC.substring(0,6)}-${amirIC.substring(6,8)}-${amirIC.substring(8)}`);
    console.log(`   Password: ${amirPassword}`);
    console.log(`   Role: Pentadbir (Admin)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

forceFixAmir();

