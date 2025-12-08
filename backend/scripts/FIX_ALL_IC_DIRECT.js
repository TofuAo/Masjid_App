import { pool } from '../config/database.js';

// Complete mapping based on name patterns - find teachers and update their ICs
const staffList = [
  { namePattern: '%ZUNNOR%', correctIC: '710515-06-5193' },
  { namePattern: '%NOOR%', correctIC: '701108-06-5175' },
  { namePattern: '%RIZZAL%', correctIC: '731014-06-5251' },
  { namePattern: '%IZZAN%', correctIC: '950717-06-5661' },
  { namePattern: '%ZANAL ABIDIN%', correctIC: '660322-06-5653' },
  { namePattern: '%KHAIRUL AZZURA%', correctIC: '740101-06-5000' },
  { namePattern: '%SHAIFUDDIN%', correctIC: '720323-06-5059' },
  { namePattern: '%SYAHIRAH%', correctIC: '930929-06-5390' },
  { namePattern: '%IHSAN%', correctIC: '911210-06-5097' },
  { namePattern: '%IZWANUDDIN%', correctIC: '900102-06-6005' },
  { namePattern: '%FIRMAN SYAMIL%', correctIC: '870526-06-5845' },
  { namePattern: '%SHARIZAL%', correctIC: '770704-06-5541' },
  { namePattern: '%HASBULLAH%', correctIC: '811026-06-5435' },
  { namePattern: '%AMIR HASIF%', correctIC: '920312-06-5113' },
  { namePattern: '%HAFIZUDDIN%', correctIC: '960505-06-5909' },
  { namePattern: '%KHAIRUL MUSTAKIM%', correctIC: '951220-06-5759' },
  { namePattern: '%SYAIFUL IZZHAR%', correctIC: '941218-07-5641' },
  { namePattern: '%PUTRI ANATI%', correctIC: '921125-06-5606' },
  { namePattern: '%NURAIN NASUHA%', correctIC: '951209-06-5192' },
  { namePattern: '%HAYATUL FAIZ%', correctIC: '931129-06-5047' },
  { namePattern: '%NABIJAH%', correctIC: '840714-02-5376' },
  { namePattern: '%NURUL SYAZWANI%', correctIC: '911115-06-5216' },
  { namePattern: '%SYAFIQ%', correctIC: '891003-06-5929' },
  { namePattern: '%ARIF HAFIZUDDIN%', correctIC: '990124-06-5179' },
  { namePattern: '%RUSDAN%', correctIC: '720301-06-5533' },
  { namePattern: '%WAZAR%', correctIC: '691222-06-5287' },
  { namePattern: '%SADIQ UMAIR%', correctIC: '991002-01-6189' },
];

const fixAllICDirect = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING ALL IC NUMBERS - DIRECT UPDATE');
    console.log('This will UPDATE existing teacher ICs to correct values');
    console.log('='.repeat(80));
    console.log(`\nProcessing ${staffList.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const results = {
      updated: [],
      alreadyCorrect: [],
      notFound: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        console.log(`\n[${staff.namePattern}]`);
        console.log(`  Target IC: ${staff.correctIC}`);
        
        // Find teacher by name pattern
        const [teachers] = await connection.execute(
          'SELECT * FROM users WHERE nama LIKE ? AND role = "teacher"',
          [staff.namePattern]
        );
        
        if (teachers.length === 0) {
          console.log(`  ❌ Not found`);
          results.notFound.push(staff.namePattern);
          continue;
        }
        
        const teacher = teachers[0];
        const oldIC = teacher.ic;
        
        console.log(`  Found: ${teacher.nama}`);
        console.log(`  Current IC: ${oldIC}`);
        
        // Check if already correct
        const oldNorm = String(oldIC).replace(/\D/g, '');
        const newNorm = String(staff.correctIC).replace(/\D/g, '');
        if (oldNorm === newNorm) {
          console.log(`  ✅ Already correct`);
          results.alreadyCorrect.push({ name: teacher.nama, ic: oldIC });
          continue;
        }
        
        // Check if new IC exists
        const [existing] = await connection.execute('SELECT * FROM users WHERE ic = ?', [staff.correctIC]);
        if (existing.length > 0 && existing[0].ic !== oldIC) {
          console.log(`  ⚠️  IC ${staff.correctIC} exists for: ${existing[0].nama}`);
          console.log(`  Deleting old entry...`);
          
          // Delete old
          await connection.execute('DELETE FROM teachers WHERE user_ic = ?', [oldIC]);
          await connection.execute('DELETE FROM user_roles WHERE user_ic = ?', [oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [staff.correctIC, oldIC]);
          await connection.execute('DELETE FROM users WHERE ic = ?', [oldIC]);
          
          results.updated.push({ name: teacher.nama, oldIC, newIC: staff.correctIC, action: 'deleted_old' });
          console.log(`  ✅ Deleted old entry`);
          continue;
        }
        
        console.log(`  Updating IC...`);
        
        // Update all tables
        await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [staff.correctIC, oldIC]);
        await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [staff.correctIC, oldIC]);
        await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [staff.correctIC, oldIC]);
        
        // Update other tables
        const otherTables = ['attendance', 'results', 'fees', 'payments', 'students'];
        for (const table of otherTables) {
          try {
            await connection.execute(`UPDATE ${table} SET user_ic = ? WHERE user_ic = ?`, [staff.correctIC, oldIC]);
          } catch (e) {
            // Skip
          }
        }
        
        // Update users (primary key)
        await connection.execute('UPDATE users SET ic = ? WHERE ic = ?', [staff.correctIC, oldIC]);
        
        console.log(`  ✅ Updated: ${oldIC} → ${staff.correctIC}`);
        results.updated.push({ name: teacher.nama, oldIC, newIC: staff.correctIC });
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.errors.push({ pattern: staff.namePattern, error: error.message });
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.commit();
    
    // Get final stats
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ic LIKE 'T%' THEN 1 END) as phone_format,
        COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format
      FROM users WHERE role = 'teacher'
    `);
    
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total teachers: ${stats[0].total}`);
    console.log(`Phone format (T...): ${stats[0].phone_format}`);
    console.log(`Valid format (XX-XX-XXXX): ${stats[0].valid_format}`);
    console.log(`✅ Updated: ${results.updated.length}`);
    console.log(`✓ Already correct: ${results.alreadyCorrect.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.updated.length > 0) {
      console.log('\n✅ UPDATED:');
      results.updated.forEach(r => {
        console.log(`   ${r.name}: ${r.oldIC} → ${r.newIC}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETED');
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

fixAllICDirect()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

