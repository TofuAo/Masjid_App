import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

const masterIC = '731014065251'; // 12 digits, no hyphens
const masterPassword = 'Rizz731051';

async function resetMasterAdminPassword() {
  try {
    console.log('Resetting master admin password...');
    console.log('Master IC:', masterIC);
    
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [masterIC]
    );
    
    if (users.length === 0) {
      console.error('❌ Master admin not found in database!');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Master admin found:', user.nama);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(masterPassword, 12);
    console.log('✅ Password hashed');
    
    // Update the password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [hashedPassword, masterIC]
    );
    
    console.log('✅ Master admin password updated successfully!');
    console.log('IC:', masterIC);
    console.log('Password:', masterPassword);
    
    // Verify the password
    const [updatedUsers] = await pool.execute(
      'SELECT password FROM users WHERE ic = ?',
      [masterIC]
    );
    
    const passwordMatches = await bcrypt.compare(masterPassword, updatedUsers[0].password);
    console.log('✅ Password verification:', passwordMatches ? 'SUCCESS' : 'FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting master admin password:', error);
    process.exit(1);
  }
}

resetMasterAdminPassword();

