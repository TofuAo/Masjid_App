import { pool } from '../config/database.js';

async function testAndFix() {
  const conn = await pool.getConnection();
  try {
    console.log('========================================');
    console.log('TESTING AND FIXING IC NUMBERS');
    console.log('========================================\n');
    
    // Step 1: Check current state
    console.log('Step 1: Checking current state...');
    const [before] = await conn.execute(`
      SELECT ic, nama FROM users 
      WHERE role = 'teacher' AND (ic = 'T0139046113' OR ic = '710515-06-5193')
      ORDER BY ic
    `);
    console.log(`Found ${before.length} user(s) with ZUNNOR IC:`);
    before.forEach(u => console.log(`  - ${u.ic}: ${u.nama}`));
    
    // Step 2: Fix IC
    console.log('\nStep 2: Fixing IC...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const [updateResult] = await conn.execute(
      'UPDATE users SET ic = ? WHERE ic = ? AND role = "teacher"',
      ['710515-06-5193', 'T0139046113']
    );
    console.log(`Updated ${updateResult.affectedRows} row(s) in users table`);
    
    await conn.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', ['710515-06-5193', 'T0139046113']);
    await conn.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', ['710515-06-5193', 'T0139046113']);
    
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    
    // Step 3: Verify
    console.log('\nStep 3: Verifying...');
    const [after] = await conn.execute(`
      SELECT ic, nama FROM users 
      WHERE role = 'teacher' AND (ic = 'T0139046113' OR ic = '710515-06-5193')
      ORDER BY ic
    `);
    console.log(`Found ${after.length} user(s) after update:`);
    after.forEach(u => console.log(`  - ${u.ic}: ${u.nama}`));
    
    // Step 4: Check all teachers with T format
    const [tFormat] = await conn.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE role = 'teacher' AND ic LIKE 'T%'
    `);
    console.log(`\nTeachers with T format IC: ${tFormat[0].count}`);
    
    console.log('\n========================================');
    console.log('COMPLETED');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    conn.release();
    process.exit(0);
  }
}

testAndFix().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});

