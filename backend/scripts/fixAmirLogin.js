// Direct script to fix Amir's login account
import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const amirIC = '920312065113';
const amirNama = 'USTAZ AMIR HASIF BIN HATA';
const amirPassword = 'Amir920313';

async function fixAmirLogin() {
  try {
    console.log('🔧 Fixing Amir login account...');
    console.log(`IC: ${amirIC}`);
    console.log(`Password: ${amirPassword}`);
    
    // Normalize IC
    const normalizedIC = amirIC.replace(/[-\s]/g, '');
    
    // Check for existing accounts
    const [existingUsers] = await pool.execute(
      `SELECT ic, nama, password, role, status 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    
    console.log(`Found ${existingUsers.length} existing account(s)`);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(amirPassword, 12);
    console.log('Password hashed');
    
    if (existingUsers.length > 0) {
      // Update all matching accounts
      for (const user of existingUsers) {
        console.log(`Updating account: ${user.ic}`);
        
        // Test current password
        let passwordMatch = false;
        if (user.password && user.password.startsWith('$2')) {
          passwordMatch = await bcrypt.compare(amirPassword, user.password);
          console.log(`Current password match: ${passwordMatch}`);
        }
        
        // Update account
        await pool.execute(
          `UPDATE users 
           SET nama = ?, 
               password = ?, 
               role = 'admin', 
               status = 'aktif', 
               updated_at = CURRENT_TIMESTAMP 
           WHERE ic = ?`,
          [amirNama, hashedPassword, user.ic]
        );
        console.log(`✅ Updated: ${user.ic}`);
      }
    } else {
      // Create new account
      console.log('Creating new account...');
      try {
        await pool.execute(
          `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
           VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [normalizedIC, amirNama, hashedPassword]
        );
        console.log(`✅ Created: ${normalizedIC}`);
      } catch (insertError) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          await pool.execute(
            `UPDATE users 
             SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
             WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
            [amirNama, hashedPassword, normalizedIC]
          );
          console.log(`✅ Updated existing: ${normalizedIC}`);
        } else {
          throw insertError;
        }
      }
    }
    
    // Verify the account
    const [verifyUsers] = await pool.execute(
      `SELECT ic, nama, role, status, password IS NOT NULL as has_password 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIC]
    );
    
    console.log('\n✅ Verification:');
    for (const user of verifyUsers) {
      console.log(`  IC: ${user.ic}`);
      console.log(`  Name: ${user.nama}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Has Password: ${user.has_password}`);
      
      // Test password
      if (user.has_password) {
        const [userWithPassword] = await pool.execute(
          `SELECT password FROM users WHERE ic = ?`,
          [user.ic]
        );
        if (userWithPassword.length > 0 && userWithPassword[0].password) {
          const passwordMatch = await bcrypt.compare(amirPassword, userWithPassword[0].password);
          console.log(`  Password Test: ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }
      }
    }
    
    await pool.end();
    console.log('\n✅ Amir account is ready for login!');
    console.log(`   IC: ${amirIC} (or ${amirIC.substring(0,6)}-${amirIC.substring(6,8)}-${amirIC.substring(8)})`);
    console.log(`   Password: ${amirPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixAmirLogin();

