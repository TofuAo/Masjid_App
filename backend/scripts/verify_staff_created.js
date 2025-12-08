import { pool } from '../config/database.js';

const correctICs = [
  "731014-06-5251", "950717-06-5661", "660322-06-5653", "710515-06-5193",
  "701108-06-5175", "740101-06-5000", "720323-06-5059", "930929-06-5390",
  "911210-06-5097", "900102-06-6005", "870526-06-5845", "770704-06-5541",
  "811026-06-5435", "920312-06-5113", "960505-06-5909", "951220-06-5759",
  "941218-07-5641", "921125-06-5606", "951209-06-5192", "931129-06-5047",
  "840714-02-5376", "911115-06-5216", "891003-06-5929", "990124-06-5179",
  "720301-06-5533", "691222-06-5287", "991002-01-6189"
];

const verifyStaff = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(70));
    console.log('VERIFYING STAFF WITH CORRECT IC NUMBERS');
    console.log('='.repeat(70));
    
    const [users] = await connection.execute(
      `SELECT ic, nama, role, email, telefon, status 
       FROM users 
       WHERE ic IN (${correctICs.map(() => '?').join(',')})
       ORDER BY nama`,
      correctICs
    );
    
    console.log(`\nFound ${users.length} users with correct ICs:\n`);
    
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.nama}`);
      console.log(`   IC: ${user.ic}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Phone: ${user.telefon || 'N/A'}`);
      console.log(`   Status: ${user.status || 'N/A'}`);
      console.log('');
    });
    
    // Check classes
    const [classes] = await connection.execute(
      `SELECT COUNT(*) as count, guru_ic 
       FROM classes 
       WHERE guru_ic IN (${correctICs.map(() => '?').join(',')})
       GROUP BY guru_ic`,
      correctICs
    );
    
    console.log('\nClasses linked to these ICs:');
    classes.forEach(cls => {
      console.log(`  IC ${cls.guru_ic}: ${cls.count} class(es)`);
    });
    
    // Check teachers
    const [teachers] = await connection.execute(
      `SELECT COUNT(*) as count, user_ic 
       FROM teachers 
       WHERE user_ic IN (${correctICs.map(() => '?').join(',')})
       GROUP BY user_ic`,
      correctICs
    );
    
    console.log('\nTeachers records:');
    teachers.forEach(teacher => {
      console.log(`  IC ${teacher.user_ic}: ${teacher.count} record(s)`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Verification complete: ${users.length}/${correctICs.length} staff found`);
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

verifyStaff()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

