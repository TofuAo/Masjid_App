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

async function verifyICUpdates() {
  const conn = await pool.getConnection();
  try {
    console.log('='.repeat(80));
    console.log('VERIFYING IC UPDATES');
    console.log('='.repeat(80));
    
    // Check teachers with correct ICs
    const [teachers] = await conn.execute(`
      SELECT u.ic, u.nama, u.telefon, t.kepakaran
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic IN (${correctICs.map(() => '?').join(',')})
        AND u.role = 'teacher'
      ORDER BY u.nama
    `, correctICs);
    
    console.log(`\nFound ${teachers.length} teachers with correct ICs:\n`);
    teachers.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.nama}`);
      console.log(`   IC: ${t.ic}`);
      console.log(`   Phone: ${t.telefon || 'N/A'}`);
      console.log('');
    });
    
    // Check for teachers with phone format ICs
    const [phoneFormat] = await conn.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE role = 'teacher' AND ic LIKE 'T%'
    `);
    
    console.log(`\nTeachers with phone format IC (T...): ${phoneFormat[0].count}`);
    
    // Overall stats
    const [stats] = await conn.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ic LIKE 'T%' THEN 1 END) as phone_format,
        COUNT(CASE WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 1 END) as valid_format
      FROM users WHERE role = 'teacher'
    `);
    
    console.log(`\nOverall Statistics:`);
    console.log(`  Total teachers: ${stats[0].total}`);
    console.log(`  Phone format (T...): ${stats[0].phone_format}`);
    console.log(`  Valid format (XX-XX-XXXX): ${stats[0].valid_format}`);
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Verification complete: ${teachers.length}/${correctICs.length} correct ICs found`);
    console.log('='.repeat(80) + '\n');
    
  } finally {
    conn.release();
    process.exit(0);
  }
}

verifyICUpdates().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

