import { pool } from '../config/database.js';

const staffUpdates = [
  { name: "TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH", correctIC: "731014-06-5251", searchTerms: ['RIZZAL', 'MOHD ALI NAFIAH'] },
  { name: "MUHAMMAD 'IZZAN BIN IDRIS", correctIC: "950717-06-5661", searchTerms: ['IZZAN', 'IDRIS'] },
  { name: "ZANAL ABIDIN BIN ISMAIL", correctIC: "660322-06-5653", searchTerms: ['ZANAL ABIDIN', 'ZANAL', 'ISMAIL'] },
  { name: "A.ZUNNOR BIN ABD RAHMAN", correctIC: "710515-06-5193", searchTerms: ['ZUNNOR', 'ABD RAHMAN'] },
  { name: "KHAIRUL AZZURA BINTI ISMAIL", correctIC: "701108-06-5175", searchTerms: ['KHAIRUL AZZURA', 'KHAIRUL', 'ISMAIL'] },
  { name: "SYAHIRAH AISYAH BINTI SUFIAN", correctIC: "740101-06-5000", searchTerms: ['SYAHIRAH', 'SUFIAN'] },
  { name: "MUHAMMAD IHSAN BIN MHD ZAHARI", correctIC: "720323-06-5059", searchTerms: ['IHSAN', 'ZAHARI'] },
  { name: "PUTRI ANATI BINTI AZAHAR", correctIC: "930929-06-5390", searchTerms: ['PUTRI ANATI', 'AZAHAR'] },
  { name: "NURUL SYAZWANI AISYAH BINTI RUSLI", correctIC: "911210-06-5097", searchTerms: ['NURUL SYAZWANI', 'RUSLI'] },
  { name: "MOHAMAD SADIQ UMAIR BIN NAHAR", correctIC: "900102-06-6005", searchTerms: ['SADIQ UMAIR', 'NAHAR'] },
];

const updateAllStaffIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = {
      updated: [],
      notFound: [],
      alreadyCorrect: []
    };
    
    console.log('Updating IC numbers for all staff members...\n');
    
    for (const staff of staffUpdates) {
      try {
        // Build search query
        const searchConditions = staff.searchTerms.map(term => `nama LIKE '%${term}%'`).join(' OR ');
        const query = `SELECT ic, nama FROM users WHERE (${searchConditions}) LIMIT 5`;
        
        const [users] = await connection.execute(query);
        
        if (users.length === 0) {
          console.log(`❌ Not found: ${staff.name}`);
          results.notFound.push(staff.name);
          continue;
        }
        
        if (users.length > 1) {
          console.log(`⚠️  Multiple matches for: ${staff.name}`);
          users.forEach(u => console.log(`   - ${u.nama} (IC: ${u.ic})`));
          // Use the first match
        }
        
        const user = users[0];
        const oldIC = user.ic;
        const newIC = staff.correctIC;
        
        // Check if already correct
        if (oldIC === newIC || oldIC.replace(/\D/g, '') === newIC.replace(/\D/g, '')) {
          console.log(`✅ Already correct: ${user.nama} (IC: ${oldIC})`);
          results.alreadyCorrect.push({ name: staff.name, ic: oldIC });
          continue;
        }
        
        console.log(`Updating: ${user.nama}`);
        console.log(`  From: ${oldIC} → To: ${newIC}`);
        
        // Update users table
        await connection.execute(
          'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
          [newIC, oldIC]
        );
        
        // Update related tables
        const updates = [
          ['students', 'user_ic'],
          ['teachers', 'user_ic'],
          ['user_roles', 'user_ic'],
          ['attendance', 'student_ic'],
          ['results', 'student_ic'],
          ['fees', 'student_ic'],
          ['payments', 'student_ic'],
          ['classes', 'guru_ic']
        ];
        
        let totalRows = 0;
        for (const [table, column] of updates) {
          try {
            const [result] = await connection.execute(
              `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
              [newIC, oldIC]
            );
            totalRows += result.affectedRows;
          } catch (e) {
            // Table or column might not exist, skip
          }
        }
        
        console.log(`  ✓ Updated (${totalRows} related rows)\n`);
        results.updated.push({ name: staff.name, oldIC, newIC });
        
      } catch (error) {
        console.error(`  ❌ Error updating ${staff.name}:`, error.message);
      }
    }
    
    await connection.commit();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${results.updated.length}`);
    console.log(`✓ Already correct: ${results.alreadyCorrect.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    
    if (results.updated.length > 0) {
      console.log('\nUpdated:');
      results.updated.forEach(r => {
        console.log(`  - ${r.name}: ${r.oldIC} → ${r.newIC}`);
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\nNot found:');
      results.notFound.forEach(name => console.log(`  - ${name}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    await connection.rollback();
    console.error('Fatal error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

updateAllStaffIC()
  .then(() => {
    console.log('\n✅ All updates completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

