import { pool } from '../config/database.js';

// Direct IC mappings - OLD IC to NEW IC
const icMappings = [
  { oldIC: 'T0139046113', newIC: '710515-06-5193', name: 'ZUNNOR' },
  { oldIC: 'T0199706272', newIC: '701108-06-5175', name: 'NOOR' },
  { oldIC: 'T0162457106', newIC: '911210-06-5097', name: 'IHSAN' },
  { oldIC: 'T0139000168', newIC: '691222-06-5287', name: 'WAZAR' },
  // Add more as you find them
];

// Name-based mappings for the 27 staff
const nameMappings = [
  { namePattern: '%ZUNNOR%', newIC: '710515-06-5193' },
  { namePattern: '%NOOR%', newIC: '701108-06-5175' },
  { namePattern: '%RIZZAL%', newIC: '731014-06-5251' },
  { namePattern: '%IZZAN%', newIC: '950717-06-5661' },
  { namePattern: '%ZANAL ABIDIN%', newIC: '660322-06-5653' },
  { namePattern: '%KHAIRUL AZZURA%', newIC: '740101-06-5000' },
  { namePattern: '%SHAIFUDDIN%', newIC: '720323-06-5059' },
  { namePattern: '%SYAHIRAH%', newIC: '930929-06-5390' },
  { namePattern: '%IHSAN%', newIC: '911210-06-5097' },
  { namePattern: '%IZWANUDDIN%', newIC: '900102-06-6005' },
  { namePattern: '%FIRMAN SYAMIL%', newIC: '870526-06-5845' },
  { namePattern: '%SHARIZAL%', newIC: '770704-06-5541' },
  { namePattern: '%HASBULLAH%', newIC: '811026-06-5435' },
  { namePattern: '%AMIR HASIF%', newIC: '920312-06-5113' },
  { namePattern: '%HAFIZUDDIN%', newIC: '960505-06-5909' },
  { namePattern: '%KHAIRUL MUSTAKIM%', newIC: '951220-06-5759' },
  { namePattern: '%SYAIFUL IZZHAR%', newIC: '941218-07-5641' },
  { namePattern: '%PUTRI ANATI%', newIC: '921125-06-5606' },
  { namePattern: '%NURAIN NASUHA%', newIC: '951209-06-5192' },
  { namePattern: '%HAYATUL FAIZ%', newIC: '931129-06-5047' },
  { namePattern: '%NABIJAH%', newIC: '840714-02-5376' },
  { namePattern: '%NURUL SYAZWANI%', newIC: '911115-06-5216' },
  { namePattern: '%SYAFIQ%', newIC: '891003-06-5929' },
  { namePattern: '%ARIF HAFIZUDDIN%', newIC: '990124-06-5179' },
  { namePattern: '%RUSDAN%', newIC: '720301-06-5533' },
  { namePattern: '%WAZAR%', newIC: '691222-06-5287' },
  { namePattern: '%SADIQ UMAIR%', newIC: '991002-01-6189' },
];

const forceFixIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FORCE FIXING IC NUMBERS - FINAL VERSION');
    console.log('This will DIRECTLY update ICs in the database');
    console.log('='.repeat(80));
    
    await connection.beginTransaction();
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    let totalUpdated = 0;
    
    // Method 1: Direct IC mappings
    console.log('\nMethod 1: Direct IC mappings...');
    for (const mapping of icMappings) {
      try {
        const [result] = await connection.execute(
          'UPDATE users SET ic = ? WHERE ic = ? AND role = "teacher"',
          [mapping.newIC, mapping.oldIC]
        );
        if (result.affectedRows > 0) {
          await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [mapping.newIC, mapping.oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.newIC, mapping.oldIC]);
          console.log(`  ✅ ${mapping.name}: ${mapping.oldIC} → ${mapping.newIC} (${result.affectedRows} row(s))`);
          totalUpdated += result.affectedRows;
        }
      } catch (e) {
        console.error(`  ❌ Error updating ${mapping.name}: ${e.message}`);
      }
    }
    
    // Method 2: Name-based mappings
    console.log('\nMethod 2: Name-based mappings...');
    for (const mapping of nameMappings) {
      try {
        // Find users matching the name pattern
        const [users] = await connection.execute(
          'SELECT ic, nama FROM users WHERE nama LIKE ? AND role = "teacher"',
          [mapping.namePattern]
        );
        
        for (const user of users) {
          const oldIC = user.ic;
          const newIC = mapping.newIC;
          
          // Skip if already correct
          if (oldIC.replace(/\D/g, '') === newIC.replace(/\D/g, '')) {
            continue;
          }
          
          // Check if new IC exists
          const [existing] = await connection.execute('SELECT * FROM users WHERE ic = ?', [newIC]);
          if (existing.length > 0 && existing[0].ic !== oldIC) {
            // Delete old, keep new
            await connection.execute('DELETE FROM teachers WHERE user_ic = ?', [oldIC]);
            await connection.execute('DELETE FROM user_roles WHERE user_ic = ?', [oldIC]);
            await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [newIC, oldIC]);
            await connection.execute('DELETE FROM users WHERE ic = ?', [oldIC]);
            console.log(`  ✅ ${user.nama}: Deleted old IC ${oldIC}, keeping ${newIC}`);
            totalUpdated++;
            continue;
          }
          
          // Update IC
          const [result] = await connection.execute('UPDATE users SET ic = ? WHERE ic = ?', [newIC, oldIC]);
          if (result.affectedRows > 0) {
            await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [newIC, oldIC]);
            await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [newIC, oldIC]);
            await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [newIC, oldIC]);
            console.log(`  ✅ ${user.nama}: ${oldIC} → ${newIC}`);
            totalUpdated++;
          }
        }
      } catch (e) {
        console.error(`  ❌ Error with pattern ${mapping.namePattern}: ${e.message}`);
      }
    }
    
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    
    // Final verification
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ic LIKE 'T%' THEN 1 END) as phone_format,
        COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format
      FROM users WHERE role = 'teacher'
    `);
    
    console.log('\n' + '='.repeat(80));
    console.log('FINAL RESULTS');
    console.log('='.repeat(80));
    console.log(`Total teachers: ${stats[0].total}`);
    console.log(`Phone format (T...): ${stats[0].phone_format}`);
    console.log(`Valid format (XX-XX-XXXX): ${stats[0].valid_format}`);
    console.log(`Total ICs updated: ${totalUpdated}`);
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

forceFixIC()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

