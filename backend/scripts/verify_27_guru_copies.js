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

async function verify27GuruCopies() {
  const conn = await pool.getConnection();
  try {
    console.log('='.repeat(80));
    console.log('VERIFYING 27 GURU COPIES WITH CORRECT ICs');
    console.log('='.repeat(80));
    console.log(`\nChecking ${correctICs.length} ICs...\n`);
    
    const [teachers] = await conn.execute(`
      SELECT u.ic, u.nama, u.email, u.telefon, u.role, u.status, t.kepakaran
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic IN (${correctICs.map(() => '?').join(',')})
        AND u.role = 'teacher'
      ORDER BY u.nama
    `, correctICs);
    
    console.log(`Found ${teachers.length} teachers with correct ICs:\n`);
    
    teachers.forEach((teacher, idx) => {
      console.log(`${idx + 1}. ${teacher.nama}`);
      console.log(`   IC: ${teacher.ic}`);
      console.log(`   Email: ${teacher.email || 'N/A'}`);
      console.log(`   Phone: ${teacher.telefon || 'N/A'}`);
      console.log(`   Status: ${teacher.status || 'N/A'}`);
      console.log(`   Kepakaran: ${teacher.kepakaran || 'N/A'}`);
      console.log('');
    });
    
    // Check classes linked to these teachers
    const [classes] = await conn.execute(`
      SELECT COUNT(*) as count, guru_ic, GROUP_CONCAT(nama_kelas SEPARATOR ', ') as classes
      FROM classes
      WHERE guru_ic IN (${correctICs.map(() => '?').join(',')})
      GROUP BY guru_ic
    `, correctICs);
    
    if (classes.length > 0) {
      console.log('\nClasses linked to these teachers:');
      classes.forEach(cls => {
        console.log(`  IC ${cls.guru_ic}: ${cls.count} class(es)`);
        if (cls.classes) {
          const classList = cls.classes.length > 150 ? cls.classes.substring(0, 150) + '...' : cls.classes;
          console.log(`    Classes: ${classList}`);
        }
      });
    } else {
      console.log('\nNo classes linked to these teachers yet.');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Verification complete: ${teachers.length}/${correctICs.length} teachers found`);
    console.log('='.repeat(80) + '\n');
    
    if (teachers.length === correctICs.length) {
      console.log('✅ All 27 teachers have been created with correct ICs!');
    } else {
      console.log(`⚠️  Only ${teachers.length} out of ${correctICs.length} teachers found.`);
      console.log('Missing ICs:');
      const foundICs = teachers.map(t => t.ic);
      const missingICs = correctICs.filter(ic => !foundICs.includes(ic));
      missingICs.forEach(ic => console.log(`  - ${ic}`));
    }
    
  } finally {
    conn.release();
    process.exit(0);
  }
}

verify27GuruCopies().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

