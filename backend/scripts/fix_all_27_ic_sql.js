import { pool } from '../config/database.js';

// Mapping of old ICs to new ICs based on name matching
const icMappings = [
  { oldIC: 'T0139046113', newIC: '710515-06-5193', name: 'ZUNNOR' },
  { oldIC: 'T0199706272', newIC: '701108-06-5175', name: 'NOOR' },
  // Add more mappings as needed
];

const fixAllIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING ALL IC NUMBERS - DIRECT SQL APPROACH');
    console.log('='.repeat(80));
    
    await connection.beginTransaction();
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const results = [];
    
    for (const mapping of icMappings) {
      try {
        console.log(`\nUpdating ${mapping.name}: ${mapping.oldIC} → ${mapping.newIC}`);
        
        // Check if old IC exists
        const [oldUser] = await connection.execute('SELECT * FROM users WHERE ic = ?', [mapping.oldIC]);
        if (oldUser.length === 0) {
          console.log(`  ⚠️  Old IC ${mapping.oldIC} not found, skipping...`);
          continue;
        }
        
        // Check if new IC already exists
        const [newUser] = await connection.execute('SELECT * FROM users WHERE ic = ?', [mapping.newIC]);
        if (newUser.length > 0) {
          console.log(`  ⚠️  New IC ${mapping.newIC} already exists, skipping...`);
          continue;
        }
        
        // Update all related tables
        await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [mapping.newIC, mapping.oldIC]);
        await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.newIC, mapping.oldIC]);
        await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [mapping.newIC, mapping.oldIC]);
        
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
    throw error;
  } finally {
    connection.release();
  }
};

fixAllIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

