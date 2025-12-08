import { pool } from '../config/database.js';

const correctICs = [
  '731014-06-5251', // RIZZAL
  '950717-06-5661', // IZZAN
  '660322-06-5653', // ZANAL ABIDIN
  '710515-06-5193', // ZUNNOR
  '701108-06-5175', // KHAIRUL AZZURA
  '740101-06-5000', // SYAHIRAH
  '720323-06-5059', // IHSAN
  '930929-06-5390', // PUTRI ANATI
  '911210-06-5097', // NURUL SYAZWANI
  '900102-06-6005', // SADIQ UMAIR
];

const verifyAllStaffIC = async () => {
  try {
    console.log('='.repeat(70));
    console.log('VERIFYING ALL STAFF IC NUMBERS');
    console.log('='.repeat(70));
    
    const [allStaff] = await pool.execute(
      `SELECT ic, nama, role FROM users WHERE ic IN (${correctICs.map(() => '?').join(',')})`,
      correctICs
    );
    
    console.log(`\nFound ${allStaff.length} staff member(s) with correct ICs:\n`);
    
    allStaff.forEach((staff, idx) => {
      const isCorrect = correctICs.includes(staff.ic);
      console.log(`${idx + 1}. ${isCorrect ? '✅' : '❌'} ${staff.nama}`);
      console.log(`   IC: ${staff.ic} ${isCorrect ? '(CORRECT)' : '(WRONG)'}`);
      console.log(`   Role: ${staff.role}`);
      console.log('');
    });
    
    // Check for any wrong ICs
    const [wrongICs] = await pool.execute(
      "SELECT ic, nama FROM users WHERE (nama LIKE '%RIZZAL%' OR nama LIKE '%IZZAN%' OR nama LIKE '%ZANAL%' OR nama LIKE '%ZUNNOR%' OR nama LIKE '%KHAIRUL AZZURA%' OR nama LIKE '%SYAHIRAH%' OR nama LIKE '%IHSAN%' OR nama LIKE '%PUTRI ANATI%' OR nama LIKE '%NURUL SYAZWANI%' OR nama LIKE '%SADIQ UMAIR%') AND ic NOT IN (?)",
      [correctICs.join("','")]
    );
    
    if (wrongICs.length > 0) {
      console.log('⚠️  Staff with incorrect ICs:');
      wrongICs.forEach(w => {
        console.log(`   - ${w.nama}: ${w.ic}`);
      });
    } else {
      console.log('✅ All staff have correct ICs!');
    }
    
    console.log('\n' + '='.repeat(70));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

verifyAllStaffIC();

