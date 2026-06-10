import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const admins = [
  { ic: '920312065113', nama: 'USTAZ AMIR HASIF BIN HATA', password: 'Amir920313' },
  { ic: '951220065759', nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', password: 'Khai951259' },
  { ic: '941218075641', nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', password: 'Izz941241' },
];

const normalizeIdentifier = (value) => (value || '').toString().replace(/[-\s]/g, '');

export async function ensureAdminAccounts() {
  try {
    console.log('🔐 Checking admin accounts...');

    for (const admin of admins) {
      // Normalize admin identifier (stored in telefon after migration)
      const normalizedIC = normalizeIdentifier(admin.ic);
      
      console.log(`  Checking: ${admin.nama} (IC: ${normalizedIC})`);
      
      // Check if admin exists by telefon first, fallback to legacy ic column
      const [users] = await pool.execute(
        `SELECT id, ic, telefon, nama, password, role, status
         FROM users 
         WHERE REPLACE(REPLACE(telefon, '-', ''), ' ', '') = ?
            OR REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
        [normalizedIC, normalizedIC]
      );

      // If we have duplicates by legacy migration issues, prefer rows with telefon populated
      users.sort((a, b) => {
        const aScore = normalizeIdentifier(a.telefon) === normalizedIC ? 1 : 0;
        const bScore = normalizeIdentifier(b.telefon) === normalizedIC ? 1 : 0;
        return bScore - aScore;
      });

      // De-duplicate by id for safety
      const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

      if (uniqueUsers.length > 1) {
        console.warn(`  ⚠️ Multiple user rows found for identifier ${normalizedIC}; updating all matches to stay consistent.`);
      }

      const usersToProcess = uniqueUsers.length > 0 ? uniqueUsers : users;

      const hashedPassword = await bcrypt.hash(admin.password, 12);

      if (usersToProcess.length > 0) {
        // Admin exists - verify password and update if needed
        for (const existingUser of usersToProcess) {
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
                             existingUser.nama !== admin.nama ||
                             normalizeIdentifier(existingUser.telefon) !== normalizedIC;

          if (needsUpdate) {
            // Update password, role, status, and ensure telefon is populated
            await pool.execute(
              `UPDATE users 
               SET nama = ?, telefon = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [admin.nama, normalizedIC, hashedPassword, existingUser.id]
            );
            console.log(`  ✅ Updated admin: ${admin.nama} (telefon: ${normalizedIC})`);
            
            // Verify the update
            const [verify] = await pool.execute(
              `SELECT ic, telefon, nama, role, status FROM users WHERE id = ?`,
              [existingUser.id]
            );
            if (verify.length > 0) {
              console.log(`  ✅ Verified: ${verify[0].nama} - Phone: ${verify[0].telefon} - Role: ${verify[0].role}, Status: ${verify[0].status}`);
            }
          } else {
            console.log(`  ✅ Admin exists and is correct: ${admin.nama} (telefon: ${existingUser.telefon})`);
          }
        }
      } else {
        // Admin doesn't exist - create it with normalized IC (no hyphens)
        console.log(`  Creating new admin account: ${admin.nama}`);
        try {
          await pool.execute(
            `INSERT INTO users (ic, telefon, nama, password, role, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [normalizedIC, normalizedIC, admin.nama, hashedPassword]
          );
          console.log(`  ✅ Created admin: ${admin.nama} (telefon: ${normalizedIC})`);
          
          // Verify the creation
          const [verify] = await pool.execute(
            `SELECT ic, telefon, nama, role, status FROM users WHERE telefon = ?`,
            [normalizedIC]
          );
          if (verify.length > 0) {
            console.log(`  ✅ Verified: ${verify[0].nama} - Phone: ${verify[0].telefon} - Role: ${verify[0].role}, Status: ${verify[0].status}`);
          }
        } catch (insertError) {
          // If insert fails (e.g., duplicate key), try to update instead
          if (insertError.code === 'ER_DUP_ENTRY') {
            console.log(`  ⚠️  Duplicate entry detected, updating instead...`);
            await pool.execute(
              `UPDATE users 
               SET nama = ?, telefon = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
               WHERE REPLACE(REPLACE(telefon, '-', ''), ' ', '') = ?
                  OR REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
              [admin.nama, normalizedIC, hashedPassword, normalizedIC, normalizedIC]
            );
            console.log(`  ✅ Updated existing admin: ${admin.nama} (telefon: ${normalizedIC})`);
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

