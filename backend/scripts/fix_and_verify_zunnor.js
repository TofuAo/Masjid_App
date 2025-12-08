import { pool } from '../config/database.js';

const fixAndVerify = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('COMPLETE FIX AND VERIFICATION FOR USTAZ ZUNNOR IC');
    console.log('='.repeat(70));
    
    // Step 1: Find ALL users matching the name
    console.log('\n[STEP 1] Finding all users with ZUNNOR or ABD RAHMAN in name...');
    const [allUsers] = await connection.execute(
      "SELECT ic, nama, role FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%'"
    );
    
    console.log(`Found ${allUsers.length} user(s):`);
    allUsers.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.nama}`);
      console.log(`     Current IC: ${u.ic}`);
      console.log(`     Role: ${u.role}`);
    });
    
    if (allUsers.length === 0) {
      console.log('\n❌ No users found!');
      process.exit(1);
    }
    
    // Step 2: Collect all old ICs
    const oldICs = new Set();
    allUsers.forEach(u => {
      oldICs.add(u.ic);
      // Add variations
      if (u.ic.startsWith('T')) {
        oldICs.add(u.ic.substring(1));
      }
      oldICs.add(u.ic.replace(/\D/g, ''));
    });
    
    console.log(`\n[STEP 2] Old IC variations found: ${Array.from(oldICs).join(', ')}`);
    const newIC = '710515-06-5193';
    console.log(`Target IC: ${newIC}`);
    
    await connection.beginTransaction();
    
    // Step 3: Update users table
    console.log('\n[STEP 3] Updating users table...');
    let usersUpdated = 0;
    for (const oldIC of oldICs) {
      const [result] = await connection.execute(
        'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [newIC, oldIC]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ Updated ${result.affectedRows} user(s) from ${oldIC} to ${newIC}`);
        usersUpdated += result.affectedRows;
      }
    }
    
    // Step 4: Update all related tables
    console.log('\n[STEP 4] Updating related tables...');
    const tables = [
      { name: 'students', columns: ['user_ic'] },
      { name: 'teachers', columns: ['user_ic'] },
      { name: 'user_roles', columns: ['user_ic'] },
      { name: 'attendance', columns: ['student_ic'] },
      { name: 'results', columns: ['student_ic'] },
      { name: 'fees', columns: ['student_ic'] },
      { name: 'payments', columns: ['student_ic'] },
      { name: 'classes', columns: ['guru_ic'] },
    ];
    
    let totalRows = 0;
    for (const table of tables) {
      for (const column of table.columns) {
        for (const oldIC of oldICs) {
          try {
            const [result] = await connection.execute(
              `UPDATE ${table.name} SET ${column} = ? WHERE ${column} = ?`,
              [newIC, oldIC]
            );
            if (result.affectedRows > 0) {
              console.log(`  ✓ ${table.name}.${column}: ${result.affectedRows} row(s) updated`);
              totalRows += result.affectedRows;
            }
          } catch (e) {
            // Skip if table/column doesn't exist
          }
        }
      }
    }
    
    await connection.commit();
    
    console.log(`\n[STEP 5] Summary:`);
    console.log(`  Users updated: ${usersUpdated}`);
    console.log(`  Related rows updated: ${totalRows}`);
    
    // Step 6: Final verification
    console.log('\n[STEP 6] Final Verification:');
    const [verify] = await connection.execute(
      'SELECT ic, nama, role FROM users WHERE ic = ?',
      [newIC]
    );
    
    if (verify.length > 0) {
      console.log('  ✅ User found with correct IC:');
      verify.forEach(v => {
        console.log(`     Name: ${v.nama}`);
        console.log(`     IC: ${v.ic}`);
        console.log(`     Role: ${v.role}`);
      });
      
      // Check related tables
      const [teachers] = await connection.execute('SELECT COUNT(*) as count FROM teachers WHERE user_ic = ?', [newIC]);
      const [classes] = await connection.execute('SELECT COUNT(*) as count FROM classes WHERE guru_ic = ?', [newIC]);
      console.log(`\n  Related records:`);
      console.log(`     Teachers table: ${teachers[0].count} record(s)`);
      console.log(`     Classes table: ${classes[0].count} record(s)`);
      
      console.log('\n' + '='.repeat(70));
      console.log('✅ SUCCESS: IC has been updated to 710515-06-5193');
      console.log('='.repeat(70) + '\n');
    } else {
      console.log('  ❌ ERROR: User not found with new IC!');
      console.log('\n' + '='.repeat(70));
      console.log('❌ FAILED: Update did not work');
      console.log('='.repeat(70) + '\n');
      process.exit(1);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    connection.release();
  }
};

fixAndVerify();

