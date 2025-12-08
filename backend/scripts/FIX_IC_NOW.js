import { pool } from '../config/database.js';

// Direct mapping of OLD IC to NEW IC for the 27 staff
const icMappings = [
  // ZUNNOR
  { oldIC: 'T0139046113', newIC: '710515-06-5193', name: 'ZUNNOR' },
  
  // NOOR
  { oldIC: 'T0199706272', newIC: '701108-06-5175', name: 'NOOR' },
  
  // Add more direct mappings as you find them
];

const fixICNow = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING IC NUMBERS - DIRECT APPROACH');
    console.log('='.repeat(80));
    console.log(`\nProcessing ${icMappings.length} IC mappings...\n`);
    
    await connection.beginTransaction();
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const results = [];
    
    for (const mapping of icMappings) {
      try {
        console.log(`\n[${mapping.name}]`);
        console.log(`  ${mapping.oldIC} → ${mapping.newIC}`);
        
        // Check if old IC exists
        const [oldUsers] = await connection.execute('SELECT * FROM users WHERE ic = ?', [mapping.oldIC]);
        if (oldUsers.length === 0) {
          console.log(`  ⚠️  Old IC ${mapping.oldIC} not found`);
          results.push({ ...mapping, status: 'old_not_found' });
          continue;
        }
        
        // Check if new IC already exists
        const [newUsers] = await connection.execute('SELECT * FROM users WHERE ic = ?', [mapping.newIC]);
        if (newUsers.length > 0) {
          console.log(`  ⚠️  New IC ${mapping.newIC} already exists for: ${newUsers[0].nama}`);
          console.log(`  Deleting old entry...`);
          
          // Delete old entry
          await connection.execute('DELETE FROM teachers WHERE user_ic = ?', [mapping.oldIC]);
          await connection.execute('DELETE FROM user_roles WHERE user_ic = ?', [mapping.oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.newIC, mapping.oldIC]);
          await connection.execute('DELETE FROM users WHERE ic = ?', [mapping.oldIC]);
          
          console.log(`  ✅ Deleted old entry`);
          results.push({ ...mapping, status: 'deleted_old' });
          continue;
        }
        
        console.log(`  Updating...`);
        
        // Update all related tables
        await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [mapping.newIC, mapping.oldIC]);
        await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.newIC, mapping.oldIC]);
        await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [mapping.newIC, mapping.oldIC]);
        
        // Update other tables
        const otherTables = ['attendance', 'results', 'fees', 'payments', 'students'];
        for (const table of otherTables) {
          try {
            await connection.execute(`UPDATE ${table} SET user_ic = ? WHERE user_ic = ?`, [mapping.newIC, mapping.oldIC]);
          } catch (e) {
            // Skip if table doesn't exist
          }
        }
        
        // Update users table (primary key)
        await connection.execute('UPDATE users SET ic = ? WHERE ic = ?', [mapping.newIC, mapping.oldIC]);
        
        console.log(`  ✅ Updated successfully!`);
        results.push({ ...mapping, status: 'updated' });
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.push({ ...mapping, status: 'error', error: error.message });
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.commit();
    
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    results.forEach(r => {
      console.log(`${r.name}: ${r.status} ${r.error ? `(${r.error})` : ''}`);
    });
    console.log('='.repeat(80) + '\n');
    
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

fixICNow()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

