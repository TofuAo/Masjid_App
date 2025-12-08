import { pool } from '../config/database.js';

const forceFixZunnorIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('FORCE FIXING USTAZ ZUNNOR IC');
    console.log('='.repeat(70));
    
    await connection.beginTransaction();
    
    // Step 1: Find ALL users with wrong IC
    console.log('\n[STEP 1] Finding all users with ZUNNOR/ABD RAHMAN or wrong IC...');
    
    const [allUsers] = await connection.execute(
      "SELECT ic, nama FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%' OR ic = 'T0139046113' OR ic = '0139046113' OR ic LIKE 'T0139046113%'"
    );
    
    console.log(`Found ${allUsers.length} user(s):`);
    allUsers.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.nama} - IC: ${u.ic}`);
    });
    
    const newIC = '710515-06-5193';
    const oldICs = new Set();
    
    allUsers.forEach(u => {
      oldICs.add(u.ic);
      if (u.ic.startsWith('T')) {
        oldICs.add(u.ic.substring(1));
      }
      oldICs.add(u.ic.replace(/\D/g, ''));
    });
    
    console.log(`\n[STEP 2] Old IC variations: ${Array.from(oldICs).join(', ')}`);
    console.log(`Target IC: ${newIC}`);
    
    // Step 3: Update users table - FORCE update
    console.log('\n[STEP 3] Updating users table...');
    let usersUpdated = 0;
    
    // First, update by name
    const [result1] = await connection.execute(
      "UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE (nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%') AND ic != ?",
      [newIC, newIC]
    );
    usersUpdated += result1.affectedRows;
    console.log(`  ✓ Updated ${result1.affectedRows} user(s) by name`);
    
    // Then update by old IC
    for (const oldIC of oldICs) {
      if (oldIC !== newIC && oldIC.replace(/\D/g, '') !== newIC.replace(/\D/g, '')) {
        const [result2] = await connection.execute(
          'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ? AND ic != ?',
          [newIC, oldIC, newIC]
        );
        if (result2.affectedRows > 0) {
          console.log(`  ✓ Updated ${result2.affectedRows} user(s) from ${oldIC}`);
          usersUpdated += result2.affectedRows;
        }
      }
    }
    
    // Step 4: Update ALL related tables
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
          if (oldIC !== newIC && oldIC.replace(/\D/g, '') !== newIC.replace(/\D/g, '')) {
            try {
              const [result] = await connection.execute(
                `UPDATE ${table.name} SET ${column} = ? WHERE ${column} = ? AND ${column} != ?`,
                [newIC, oldIC, newIC]
              );
              if (result.affectedRows > 0) {
                console.log(`  ✓ ${table.name}.${column}: ${result.affectedRows} row(s) from ${oldIC}`);
                totalRows += result.affectedRows;
              }
            } catch (e) {
              // Skip if table/column doesn't exist
            }
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
      console.log('  ✅ SUCCESS: User found with correct IC:');
      verify.forEach(v => {
        console.log(`     Name: ${v.nama}`);
        console.log(`     IC: ${v.ic}`);
        console.log(`     Role: ${v.role}`);
      });
      
      // Check for any remaining wrong ICs
      const [wrong] = await connection.execute(
        "SELECT ic, nama FROM users WHERE (nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%') AND ic != ?",
        [newIC]
      );
      
      if (wrong.length > 0) {
        console.log('\n  ⚠️  WARNING: Found users with wrong IC:');
        wrong.forEach(w => {
          console.log(`     ${w.nama}: ${w.ic}`);
        });
      } else {
        console.log('\n  ✅ No users found with wrong IC');
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('✅ IC SUCCESSFULLY UPDATED TO 710515-06-5193');
      console.log('='.repeat(70) + '\n');
    } else {
      console.log('  ❌ ERROR: User not found with new IC!');
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

forceFixZunnorIC();

