import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const admins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

export async function ensureAdminAccounts() {
  try {
    console.log('🔐 Checking admin accounts...');

    for (const admin of admins) {
      // Normalize IC (remove hyphens and spaces)
      const normalizedIC = admin.ic.replace(/[-\s]/g, '');
      
      console.log(`  Checking: ${admin.nama} (IC: ${normalizedIC})`);
      
      // Check if admin exists (try both hyphenated and non-hyphenated formats)
      const [users] = await pool.execute(
        `SELECT ic, nama, password, role, status FROM users 
         WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
        [normalizedIC]
      );

      const hashedPassword = await bcrypt.hash(admin.password, 12);

      if (users.length > 0) {
        // Admin exists - verify password and update if needed
        for (const existingUser of users) {
          let passwordMatch = false;
          if (existingUser.password) {
            // Check if password is hashed
            if (existingUser.password.startsWith('$2')) {
              passwordMatch = await bcrypt.compare(admin.password, existingUser.password);
            } else {
              // Plaintext password - needs to be updated
              passwordMatch = false;
            }
          }

          const needsUpdate = !passwordMatch || 
                             existingUser.status !== 'aktif' || 
                             (existingUser.role || '').toLowerCase() !== 'admin' ||
                             existingUser.nama !== admin.nama;

          if (needsUpdate) {
            // Update password, role, and status for this specific IC format
            await pool.execute(
              `UPDATE users 
               SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
               WHERE ic = ?`,
              [admin.nama, hashedPassword, existingUser.ic]
            );
            console.log(`  ✅ Updated admin: ${admin.nama} (IC: ${existingUser.ic})`);
            
            // Verify the update
            const [verify] = await pool.execute(
              `SELECT ic, nama, role, status FROM users WHERE ic = ?`,
              [existingUser.ic]
            );
            if (verify.length > 0) {
              console.log(`  ✅ Verified: ${verify[0].nama} - Role: ${verify[0].role}, Status: ${verify[0].status}`);
            }
          } else {
            console.log(`  ✅ Admin exists and is correct: ${admin.nama} (IC: ${existingUser.ic})`);
          }
        }
      } else {
        // Admin doesn't exist - create it with normalized IC (no hyphens)
        console.log(`  Creating new admin account: ${admin.nama}`);
        try {
          await pool.execute(
            `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
             VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [normalizedIC, admin.nama, hashedPassword]
          );
          console.log(`  ✅ Created admin: ${admin.nama} (IC: ${normalizedIC})`);
          
          // Verify the creation
          const [verify] = await pool.execute(
            `SELECT ic, nama, role, status FROM users WHERE ic = ?`,
            [normalizedIC]
          );
          if (verify.length > 0) {
            console.log(`  ✅ Verified: ${verify[0].nama} - Role: ${verify[0].role}, Status: ${verify[0].status}`);
          }
        } catch (insertError) {
          // If insert fails (e.g., duplicate key), try to update instead
          if (insertError.code === 'ER_DUP_ENTRY') {
            console.log(`  ⚠️  Duplicate entry detected, updating instead...`);
            await pool.execute(
              `UPDATE users 
               SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
               WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
              [admin.nama, hashedPassword, normalizedIC]
            );
            console.log(`  ✅ Updated existing admin: ${admin.nama} (IC: ${normalizedIC})`);
          } else {
            console.error(`  ❌ Error creating admin: ${insertError.message}`);
            throw insertError;
          }
        }
      }
    }

    console.log('✅ Admin accounts verified\n');
  } catch (error) {
    console.error('❌ Failed to ensure admin accounts:', error.message);
    console.error('Error details:', error);
    // Don't throw - allow server to start even if this fails
  }
}

