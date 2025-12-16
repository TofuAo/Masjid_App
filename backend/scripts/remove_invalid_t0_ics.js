import { pool } from '../config/database.js';

/**
 * Script to find and remove all invalid IC numbers starting with "T0"
 * These are phone numbers incorrectly stored as ICs
 */
const removeInvalidT0ICs = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('REMOVING INVALID IC NUMBERS (T0-prefixed)');
    console.log('='.repeat(80));
    
    await connection.beginTransaction();
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Step 1: Find all invalid ICs (T0-prefixed, starting with non-digits, wrong format)
    console.log('\nStep 1: Finding all invalid ICs...');
    const [invalidUsers] = await connection.execute(`
      SELECT ic, nama, role 
      FROM users 
      WHERE ic LIKE 'T0%' 
         OR ic REGEXP '^[^0-9]'
         OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
      ORDER BY ic
    `);
    
    if (invalidUsers.length === 0) {
      console.log('✅ No invalid ICs found in users table.');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      await connection.commit();
      return;
    }
    
    console.log(`\nFound ${invalidUsers.length} invalid IC(s) (T0-prefixed, non-digit starting, or wrong format):`);
    invalidUsers.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.ic} - ${user.nama} (${user.role})`);
    });
    
    // Step 2: Remove from all related tables
    console.log('\nStep 2: Removing from all related tables...');
    
    let totalDeleted = 0;
    
    for (const user of invalidUsers) {
      const ic = user.ic;
      console.log(`\nProcessing: ${ic} (${user.nama})...`);
      
      try {
        // Delete from child tables first (due to foreign keys)
        const tables = [
          { name: 'staff_checkin', column: 'staff_ic', isUpdate: false },
          { name: 'user_roles', column: 'user_ic', isUpdate: false },
          { name: 'fees', column: 'student_ic', isUpdate: false },
          { name: 'results', column: 'student_ic', isUpdate: false },
          { name: 'attendance', column: 'student_ic', isUpdate: false },
          { name: 'classes', column: 'guru_ic', isUpdate: true }, // UPDATE to NULL instead of DELETE
          { name: 'teachers', column: 'user_ic', isUpdate: false },
          { name: 'students', column: 'user_ic', isUpdate: false },
        ];
        
        for (const table of tables) {
          if (table.isUpdate) {
            const [result] = await connection.execute(
              `UPDATE ${table.name} SET ${table.column} = NULL WHERE ${table.column} = ?`,
              [ic]
            );
            if (result.affectedRows > 0) {
              console.log(`  ✓ Updated ${result.affectedRows} row(s) in ${table.name} (set to NULL)`);
            }
          } else {
            const [result] = await connection.execute(
              `DELETE FROM ${table.name} WHERE ${table.column} = ?`,
              [ic]
            );
            if (result.affectedRows > 0) {
              console.log(`  ✓ Deleted ${result.affectedRows} row(s) from ${table.name}`);
            }
          }
        }
        
        // Finally delete from users table
        const [result] = await connection.execute(
          'DELETE FROM users WHERE ic = ?',
          [ic]
        );
        
        if (result.affectedRows > 0) {
          console.log(`  ✓ Deleted from users table`);
          totalDeleted++;
        }
      } catch (error) {
        console.error(`  ❌ Error deleting ${ic}: ${error.message}`);
      }
    }
    
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    
    // Step 3: Final verification
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    
    const [remaining] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE ic LIKE 'T0%' 
         OR ic REGEXP '^[^0-9]'
         OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12)
    `);
    
    const [allStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN ic LIKE 'T0%' THEN 1 END) as t0_ics,
        COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format,
        COUNT(CASE WHEN LENGTH(REPLACE(ic, '-', '')) = 12 AND ic REGEXP '^[0-9]' THEN 1 END) as valid_digits
      FROM users
    `);
    
    console.log(`Total users: ${allStats[0].total_users}`);
    console.log(`Remaining T0-prefixed ICs: ${remaining[0].count}`);
    console.log(`Valid format (XX-XX-XXXX): ${allStats[0].valid_format}`);
    console.log(`Valid 12-digit ICs: ${allStats[0].valid_digits}`);
    console.log(`Total deleted: ${totalDeleted}`);
    console.log('='.repeat(80));
    
    if (remaining[0].count > 0) {
      console.log('\n⚠️  WARNING: Some T0-prefixed ICs still remain!');
      const [stillRemaining] = await connection.execute(`
        SELECT ic, nama, role 
        FROM users 
        WHERE ic LIKE 'T0%'
      `);
      stillRemaining.forEach(user => {
        console.log(`  - ${user.ic} - ${user.nama} (${user.role})`);
      });
    } else {
      console.log('\n✅ All T0-prefixed ICs have been successfully removed!');
    }
    
  } catch (error) {
    await connection.rollback();
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    connection.release();
  }
};

removeInvalidT0ICs()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

