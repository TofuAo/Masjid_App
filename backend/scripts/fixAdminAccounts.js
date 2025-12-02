import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const admins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

async function fixAdminAccounts() {
  try {
    console.log('🔧 Fixing admin accounts...\n');

    for (const admin of admins) {
      const normalizedIC = admin.ic.replace(/[-\s]/g, '');
      
      // Check if admin exists
      const [users] = await pool.execute(
        `SELECT ic, nama, password, role, status FROM users WHERE REPLACE(ic, '-', '') = ?`,
        [normalizedIC]
      );

      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 12);

      if (users.length > 0) {
        const existingUser = users[0];
        
        // Test current password
        const passwordMatch = await bcrypt.compare(admin.password, existingUser.password);
        
        console.log(`Admin: ${admin.nama}`);
        console.log(`  IC: ${existingUser.ic}`);
        console.log(`  Current Role: ${existingUser.role}`);
        console.log(`  Current Status: ${existingUser.status}`);
        console.log(`  Password Match: ${passwordMatch ? '✅' : '❌'}`);
        
        // Update if needed
        if (!passwordMatch || existingUser.status !== 'aktif' || existingUser.role !== 'admin') {
          await pool.execute(
            `UPDATE users 
             SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
             WHERE REPLACE(ic, '-', '') = ?`,
            [admin.nama, hashedPassword, normalizedIC]
          );
          console.log(`  ✅ UPDATED: Password, role, and status fixed\n`);
        } else {
          console.log(`  ✅ OK: Account is correct\n`);
        }
      } else {
        // Create new admin
        await pool.execute(
          `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
           VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [admin.ic, admin.nama, hashedPassword]
        );
        console.log(`Admin: ${admin.nama}`);
        console.log(`  ✅ CREATED: New admin account created\n`);
      }
    }

    // Verify all admins
    console.log('📋 Verifying all admin accounts:\n');
    const [allAdmins] = await pool.execute(
      `SELECT ic, nama, role, status FROM users WHERE role = 'admin' AND status = 'aktif' ORDER BY nama`
    );
    
    for (const admin of allAdmins) {
      console.log(`  ✅ ${admin.nama} (IC: ${admin.ic})`);
    }

    console.log(`\n✅ All admin accounts fixed!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin accounts:', error);
    process.exit(1);
  }
}

fixAdminAccounts();

