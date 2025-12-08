import { pool } from '../config/database.js';

const fixZunnorIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(60));
    console.log('FIXING USTAZ ZUNNOR IC');
    console.log('='.repeat(60));
    
    await connection.beginTransaction();
    
    // Step 1: Find all users that match
    const [allUsers] = await connection.execute(
      "SELECT ic, nama FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%'"
    );
    
    console.log(`\nFound ${allUsers.length} user(s):`);
    allUsers.forEach(u => {
      console.log(`  - ${u.nama}: ${u.ic}`);
    });
    
    if (allUsers.length === 0) {
      console.log('\n❌ No users found!');
      await connection.rollback();
      process.exit(1);
    }
    
    // Step 2: Get all old IC variations
    const oldICs = new Set();
    allUsers.forEach(u => {
      oldICs.add(u.ic);
      // Also add variations
      if (u.ic.startsWith('T')) {
        oldICs.add(u.ic.substring(1)); // Remove T prefix
      }
      oldICs.add(u.ic.replace(/\D/g, '')); // Numbers only
    });
    
    console.log(`\nOld IC variations to update: ${Array.from(oldICs).join(', ')}`);
    const newIC = '710515-06-5193';
    
    // Step 3: Update users table - update ALL matching users
    let usersUpdated = 0;
    for (const oldIC of oldICs) {
      const [result] = await connection.execute(
        'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [newIC, oldIC]
      );
      if (result.affectedRows > 0) {
        console.log(`✓ Updated users: ${oldIC} → ${newIC} (${result.affectedRows} rows)`);
        usersUpdated += result.affectedRows;
      }
    }
    
    // Step 4: Update all related tables
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
              console.log(`✓ Updated ${table.name}.${column}: ${oldIC} → ${newIC} (${result.affectedRows} rows)`);
              totalRows += result.affectedRows;
            }
          } catch (e) {
            // Table or column might not exist, skip silently
          }
        }
      }
    }
    
    await connection.commit();
    
    console.log(`\n✅ Update Summary:`);
    console.log(`   Users updated: ${usersUpdated}`);
    console.log(`   Related rows updated: ${totalRows}`);
    
    // Step 5: Verify
    const [verify] = await connection.execute(
      'SELECT ic, nama, role FROM users WHERE ic = ?',
      [newIC]
    );
    
    console.log(`\n✅ Verification:`);
    if (verify.length > 0) {
      verify.forEach(v => {
        console.log(`   ${v.nama} - IC: ${v.ic} - Role: ${v.role}`);
      });
      console.log('\n✅ IC successfully updated to 710515-06-5193!');
    } else {
      console.log('   ❌ User not found with new IC!');
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    connection.release();
  }
};

fixZunnorIC()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

