import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration script to fix users with invalid IC formats
 * This script finds users with ICs that don't match the 12-digit format
 * and generates new valid ICs, updating all related tables
 */
async function fixInvalidICFormats() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Starting migration: Fix Invalid IC Formats...');
    
    // Step 1: Find users with invalid IC formats
    const [invalidUsers] = await connection.execute(`
      SELECT ic, nama, role
      FROM users
      WHERE LENGTH(REPLACE(ic, '-', '')) != 12
         OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$')
      ORDER BY ic
    `);
    
    if (invalidUsers.length === 0) {
      console.log('No users with invalid IC formats found. Migration not needed.');
      await connection.rollback();
      return;
    }
    
    console.log(`Found ${invalidUsers.length} users with invalid IC formats:`);
    invalidUsers.forEach(user => {
      console.log(`  - ${user.ic} (${user.nama}, ${user.role})`);
    });
    
    // Step 2: Generate new valid ICs
    const basePrefix = `99${new Date().toISOString().slice(2, 6).replace('-', '')}`; // YYMM format
    const mappings = [];
    
    // Find max existing counter to avoid conflicts
    const [maxResult] = await connection.execute(`
      SELECT MAX(CAST(SUBSTRING(REPLACE(ic, '-', ''), 7) AS UNSIGNED)) as max_counter
      FROM users 
      WHERE REPLACE(ic, '-', '') LIKE ?
        AND LENGTH(REPLACE(ic, '-', '')) = 12
    `, [`${basePrefix}%`]);
    
    let startCounter = maxResult[0]?.max_counter || 0;
    console.log(`Starting counter at: ${startCounter}`);
    
    // Generate unique ICs for each invalid user
    invalidUsers.forEach((user, index) => {
      const counter = startCounter + index + 1;
      const newICDigits = `${basePrefix}${String(counter).padStart(6, '0')}`;
      const newICFormatted = `${newICDigits.substring(0, 6)}-${newICDigits.substring(6, 8)}-${newICDigits.substring(8, 12)}`;
      
      mappings.push({
        oldIC: user.ic,
        newIC: newICFormatted,
        nama: user.nama,
        role: user.role
      });
    });
    
    console.log('\nGenerated new ICs:');
    mappings.forEach(m => {
      console.log(`  ${m.oldIC} -> ${m.newIC} (${m.nama})`);
    });
    
    // Step 3: Update all related tables
    console.log('\nUpdating related tables...');
    
    for (const mapping of mappings) {
      // Update students table
      await connection.execute(
        'UPDATE students SET user_ic = ? WHERE user_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update teachers table
      await connection.execute(
        'UPDATE teachers SET user_ic = ? WHERE user_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update classes table (guru_ic)
      await connection.execute(
        'UPDATE classes SET guru_ic = ? WHERE guru_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update attendance table (student_ic)
      await connection.execute(
        'UPDATE attendance SET student_ic = ? WHERE student_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update attendance table (marked_by)
      await connection.execute(
        'UPDATE attendance SET marked_by = ? WHERE marked_by = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update results table
      await connection.execute(
        'UPDATE results SET student_ic = ? WHERE student_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update fees table
      await connection.execute(
        'UPDATE fees SET student_ic = ? WHERE student_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update user_roles table
      await connection.execute(
        'UPDATE user_roles SET user_ic = ? WHERE user_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update pending_pic_changes table
      await connection.execute(
        'UPDATE pending_pic_changes SET created_by = ? WHERE created_by = ?',
        [mapping.newIC, mapping.oldIC]
      );
      await connection.execute(
        'UPDATE pending_pic_changes SET approved_by = ? WHERE approved_by = ?',
        [mapping.newIC, mapping.oldIC]
      );
      
      // Update admin_action_snapshots table
      await connection.execute(
        'UPDATE admin_action_snapshots SET actor_ic = ? WHERE actor_ic = ?',
        [mapping.newIC, mapping.oldIC]
      );
    }
    
    // Step 4: Update users table (need to insert new and delete old)
    console.log('\nUpdating users table...');
    
    for (const mapping of mappings) {
      // Get the user data
      const [users] = await connection.execute(
        'SELECT * FROM users WHERE ic = ?',
        [mapping.oldIC]
      );
      
      if (users.length > 0) {
        const user = users[0];
        
        // Insert new user record with new IC
        await connection.execute(
          `INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            mapping.newIC,
            user.nama,
            user.umur,
            user.alamat,
            user.telefon,
            user.email,
            user.password,
            user.role,
            user.status,
            user.created_at
          ]
        );
        
        // Delete old user record
        await connection.execute(
          'DELETE FROM users WHERE ic = ?',
          [mapping.oldIC]
        );
      }
    }
    
    // Step 5: Verify the changes
    const [remainingInvalid] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE LENGTH(REPLACE(ic, '-', '')) != 12
         OR NOT (REPLACE(ic, '-', '') REGEXP '^[0-9]{12}$')
    `);
    
    if (remainingInvalid[0].count === 0) {
      await connection.commit();
      console.log('\n✅ Migration completed successfully!');
      console.log(`Fixed ${mappings.length} users with invalid IC formats.`);
      console.log('All users now have valid 12-digit IC formats.');
    } else {
      throw new Error(`Migration incomplete. ${remainingInvalid[0].count} users still have invalid IC formats.`);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fixInvalidICFormats.js');

if (isMainModule || process.argv[1]?.endsWith('fixInvalidICFormats.js')) {
  fixInvalidICFormats()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default fixInvalidICFormats;

