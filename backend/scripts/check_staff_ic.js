import { pool } from '../config/database.js';

const checkStaffIC = async () => {
  try {
    // Check for USTAZ A.ZUNNOR BIN ABD RAHMAN
    const [users] = await pool.execute(
      "SELECT ic, nama FROM users WHERE nama LIKE '%ZUNNOR%' OR nama LIKE '%ABD RAHMAN%'"
    );
    
    console.log('Found users with ZUNNOR or ABD RAHMAN in name:');
    users.forEach(user => {
      console.log(`  - ${user.nama}: IC = ${user.ic}`);
    });
    
    // Check all staff from the list
    const staffNames = [
      "MOHD RIZZAL",
      "IZZAN",
      "ZANAL ABIDIN",
      "ZUNNOR",
      "KHAIRUL AZZURA",
      "SYAHIRAH",
      "IHSAN",
      "PUTRI ANATI",
      "NURUL SYAZWANI",
      "SADIQ UMAIR"
    ];
    
    console.log('\nChecking all staff ICs:');
    for (const name of staffNames) {
      const [matches] = await pool.execute(
        `SELECT ic, nama FROM users WHERE nama LIKE ?`,
        [`%${name}%`]
      );
      if (matches.length > 0) {
        matches.forEach(m => {
          console.log(`  ${m.nama}: ${m.ic}`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkStaffIC();

