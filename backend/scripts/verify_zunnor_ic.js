import { pool } from '../config/database.js';

const verify = async () => {
  try {
    console.log('Verifying USTAZ A.ZUNNOR BIN ABD RAHMAN IC...\n');
    
    // Check users table
    const [users] = await pool.execute(
      "SELECT ic, nama, role FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%' OR ic = '710515-06-5193'"
    );
    
    console.log('Users found:', users.length);
    users.forEach(u => {
      const isCorrect = u.ic === '710515-06-5193' || u.ic.replace(/\D/g, '') === '710515065193';
      console.log(`  ${isCorrect ? '✅' : '❌'} ${u.nama}`);
      console.log(`     IC: ${u.ic} ${isCorrect ? '(CORRECT)' : '(WRONG - should be 710515-06-5193)'}`);
      console.log(`     Role: ${u.role}`);
    });
    
    // Check teachers table
    const [teachers] = await pool.execute(
      "SELECT t.user_ic, u.nama FROM teachers t JOIN users u ON t.user_ic = u.ic WHERE u.nama LIKE '%ZUNNOR%' OR u.nama LIKE '%ABD RAHMAN%'"
    );
    console.log(`\nTeachers table: ${teachers.length} record(s)`);
    teachers.forEach(t => {
      console.log(`  IC: ${t.user_ic}, Name: ${t.nama}`);
    });
    
    // Check classes table
    const [classes] = await pool.execute(
      "SELECT c.guru_ic, u.nama, c.nama_kelas FROM classes c JOIN users u ON c.guru_ic = u.ic WHERE u.nama LIKE '%ZUNNOR%' OR u.nama LIKE '%ABD RAHMAN%'"
    );
    console.log(`\nClasses table: ${classes.length} record(s)`);
    classes.forEach(c => {
      console.log(`  IC: ${c.guru_ic}, Name: ${c.nama}, Class: ${c.nama_kelas}`);
    });
    
    const allCorrect = users.every(u => u.ic === '710515-06-5193' || u.ic.replace(/\D/g, '') === '710515065193');
    
    if (allCorrect) {
      console.log('\n✅ All ICs are correct!');
    } else {
      console.log('\n❌ Some ICs are still incorrect. Please run the fix script.');
    }
    
    process.exit(allCorrect ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

verify();

