import { pool } from '../config/database.js';

const fixZunnorIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Finding USTAZ A.ZUNNOR BIN ABD RAHMAN...');
    
    // Find user with any IC (including wrong ones)
    const [users] = await connection.execute(
      "SELECT ic, nama FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%'"
    );
    
    if (users.length === 0) {
      console.log('❌ User not found!');
      await connection.rollback();
      process.exit(1);
    }
    
    const user = users[0];
    const oldIC = user.ic;
    const newIC = '710515-06-5193';
    
    console.log(`Found: ${user.nama}`);
    console.log(`Current IC: ${oldIC}`);
    console.log(`Target IC: ${newIC}`);
    
    if (oldIC === newIC || oldIC.replace(/\D/g, '') === newIC.replace(/\D/g, '')) {
      console.log('✅ IC is already correct!');
      await connection.rollback();
      process.exit(0);
    }
    
    console.log('\nUpdating IC...');
    
    // Update users table
    await connection.execute(
      'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [newIC, oldIC]
    );
    console.log('✓ Updated users table');
    
    // Update all related tables with old IC (any format)
    const oldICVariations = [oldIC, oldIC.replace(/\D/g, ''), oldIC.replace(/^T/, '')];
    
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
        for (const oldICVar of oldICVariations) {
          try {
            const [result] = await connection.execute(
              `UPDATE ${table.name} SET ${column} = ? WHERE ${column} = ?`,
              [newIC, oldICVar]
            );
            if (result.affectedRows > 0) {
              console.log(`✓ Updated ${table.name}.${column}: ${oldICVar} → ${newIC} (${result.affectedRows} rows)`);
              totalRows += result.affectedRows;
            }
          } catch (e) {
            // Table or column might not exist, skip
          }
        }
      }
    }
    
    await connection.commit();
    
    console.log(`\n✅ Successfully updated! Total rows updated: ${totalRows}`);
    
    // Verify
    const [verify] = await connection.execute(
      'SELECT ic, nama FROM users WHERE ic = ?',
      [newIC]
    );
    console.log(`\nVerification: ${verify[0].nama} now has IC ${verify[0].ic}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

fixZunnorIC()
  .then(() => {
    console.log('\n✅ IC update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

