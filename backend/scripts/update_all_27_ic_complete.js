import { pool } from '../config/database.js';

// Staff list with name patterns and correct ICs
const staffMappings = [
  { namePattern: '%ZUNNOR%', correctIC: '710515-06-5193', oldICPattern: 'T0139046113' },
  { namePattern: '%NOOR%', correctIC: '701108-06-5175', oldICPattern: 'T0199706272' },
  { namePattern: '%RIZZAL%', correctIC: '731014-06-5251', oldICPattern: null },
  { namePattern: '%IZZAN%', correctIC: '950717-06-5661', oldICPattern: null },
  { namePattern: '%ZANAL ABIDIN%', correctIC: '660322-06-5653', oldICPattern: null },
  { namePattern: '%KHAIRUL AZZURA%', correctIC: '740101-06-5000', oldICPattern: null },
  { namePattern: '%SHAIFUDDIN%', correctIC: '720323-06-5059', oldICPattern: null },
  { namePattern: '%SYAHIRAH%', correctIC: '930929-06-5390', oldICPattern: null },
  { namePattern: '%IHSAN%', correctIC: '911210-06-5097', oldICPattern: null },
  { namePattern: '%IZWANUDDIN%', correctIC: '900102-06-6005', oldICPattern: null },
  { namePattern: '%FIRMAN SYAMIL%', correctIC: '870526-06-5845', oldICPattern: null },
  { namePattern: '%SHARIZAL%', correctIC: '770704-06-5541', oldICPattern: null },
  { namePattern: '%HASBULLAH%', correctIC: '811026-06-5435', oldICPattern: null },
  { namePattern: '%AMIR HASIF%', correctIC: '920312-06-5113', oldICPattern: null },
  { namePattern: '%HAFIZUDDIN%', correctIC: '960505-06-5909', oldICPattern: null },
  { namePattern: '%KHAIRUL MUSTAKIM%', correctIC: '951220-06-5759', oldICPattern: null },
  { namePattern: '%SYAIFUL IZZHAR%', correctIC: '941218-07-5641', oldICPattern: null },
  { namePattern: '%PUTRI ANATI%', correctIC: '921125-06-5606', oldICPattern: null },
  { namePattern: '%NURAIN NASUHA%', correctIC: '951209-06-5192', oldICPattern: null },
  { namePattern: '%HAYATUL FAIZ%', correctIC: '931129-06-5047', oldICPattern: null },
  { namePattern: '%NABIJAH%', correctIC: '840714-02-5376', oldICPattern: null },
  { namePattern: '%NURUL SYAZWANI%', correctIC: '911115-06-5216', oldICPattern: null },
  { namePattern: '%SYAFIQ%', correctIC: '891003-06-5929', oldICPattern: null },
  { namePattern: '%ARIF HAFIZUDDIN%', correctIC: '990124-06-5179', oldICPattern: null },
  { namePattern: '%RUSDAN%', correctIC: '720301-06-5533', oldICPattern: null },
  { namePattern: '%WAZAR%', correctIC: '691222-06-5287', oldICPattern: null },
  { namePattern: '%SADIQ UMAIR%', correctIC: '991002-01-6189', oldICPattern: null },
];

const updateAllIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('UPDATING ALL 27 GURU IC NUMBERS');
    console.log('='.repeat(80));
    console.log(`\nProcessing ${staffMappings.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const results = {
      updated: [],
      skipped: [],
      errors: []
    };
    
    for (const mapping of staffMappings) {
      try {
        console.log(`\n[${mapping.namePattern}]`);
        console.log(`  Target IC: ${mapping.correctIC}`);
        
        // Find teacher by name pattern
        const [teachers] = await connection.execute(
          'SELECT * FROM users WHERE nama LIKE ? AND role = "teacher"',
          [mapping.namePattern]
        );
        
        if (teachers.length === 0) {
          console.log(`  ❌ No teacher found with pattern: ${mapping.namePattern}`);
          results.skipped.push({ pattern: mapping.namePattern, reason: 'not_found' });
          continue;
        }
        
        if (teachers.length > 1) {
          console.log(`  ⚠️  Multiple teachers found (${teachers.length}), using first one`);
        }
        
        const teacher = teachers[0];
        const oldIC = teacher.ic;
        
        console.log(`  Found: ${teacher.nama}`);
        console.log(`  Current IC: ${oldIC}`);
        
        // Check if already correct
        const oldICNorm = String(oldIC).replace(/\D/g, '');
        const newICNorm = String(mapping.correctIC).replace(/\D/g, '');
        if (oldICNorm === newICNorm) {
          console.log(`  ✅ Already correct`);
          results.skipped.push({ pattern: mapping.namePattern, reason: 'already_correct' });
          continue;
        }
        
        // Check if new IC already exists
        const [existing] = await connection.execute(
          'SELECT * FROM users WHERE ic = ?',
          [mapping.correctIC]
        );
        
        if (existing.length > 0 && existing[0].ic !== oldIC) {
          console.log(`  ⚠️  IC ${mapping.correctIC} already exists for: ${existing[0].nama}`);
          console.log(`  Will update that entry instead...`);
          
          // Delete old entry
          await connection.execute('DELETE FROM teachers WHERE user_ic = ?', [oldIC]);
          await connection.execute('DELETE FROM user_roles WHERE user_ic = ?', [oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.correctIC, oldIC]);
          await connection.execute('DELETE FROM users WHERE ic = ?', [oldIC]);
          
          // Update existing entry
          await connection.execute(
            `UPDATE users SET nama = ?, email = ?, telefon = ?, status = ? WHERE ic = ?`,
            [teacher.nama, teacher.email || null, teacher.telefon || null, teacher.status || 'aktif', mapping.correctIC]
          );
          
          const [kepakaran] = await connection.execute('SELECT kepakaran FROM teachers WHERE user_ic = ?', [oldIC]);
          if (kepakaran.length > 0) {
            await connection.execute(
              'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?) ON DUPLICATE KEY UPDATE kepakaran = ?',
              [mapping.correctIC, kepakaran[0].kepakaran || '[]', kepakaran[0].kepakaran || '[]']
            );
          }
          
          results.updated.push({ name: teacher.nama, oldIC, newIC: mapping.correctIC, action: 'merged' });
          console.log(`  ✅ Merged and updated`);
          continue;
        }
        
        // Update IC
        console.log(`  Updating IC...`);
        
        // Update related tables
        await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [mapping.correctIC, oldIC]);
        await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [mapping.correctIC, oldIC]);
        await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [mapping.correctIC, oldIC]);
        
        // Update users table
        await connection.execute('UPDATE users SET ic = ? WHERE ic = ?', [mapping.correctIC, oldIC]);
        
        console.log(`  ✅ Updated: ${oldIC} → ${mapping.correctIC}`);
        results.updated.push({ name: teacher.nama, oldIC, newIC: mapping.correctIC });
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.errors.push({ pattern: mapping.namePattern, error: error.message });
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.commit();
    
    // Get final count
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Final teacher count: ${finalCount[0].count}`);
    console.log(`✅ Updated: ${results.updated.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);
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

updateAllIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

