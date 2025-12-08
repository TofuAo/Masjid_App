import { pool } from '../config/database.js';

// Staff list with correct IC numbers - ONLY fixing IC, not other data
const staffList = [
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

const normalizeIC = (ic) => {
  if (!ic) return '';
  return String(ic).replace(/\D/g, '');
};

const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, "'")
    .replace(/^(USTAZ|USTAZAH|TUAN|TUAN HAJI|HAJI|HAJAH|ENCIK|CIK|DR|DATO|DATUK|DATO'|DATUK'|TAN SRI|PUAN|PN)\s+/i, '')
    .trim();
};

const fixAllStaffIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(70));
    console.log('FIXING IC NUMBERS FOR ALL STAFF MEMBERS');
    console.log('ONLY UPDATING IC - NO OTHER DATA CHANGED');
    console.log('='.repeat(70));
    console.log(`\nProcessing ${staffList.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    const results = {
      updated: [],
      notFound: [],
      alreadyCorrect: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        console.log(`\n[${staff.name}]`);
        console.log(`  Target IC: ${staff.correctIC}`);
        
        // Build search query
        const searchConditions = staff.searchTerms.map(term => `nama LIKE '%${term}%'`).join(' OR ');
        const query = `SELECT ic, nama FROM users WHERE (${searchConditions}) LIMIT 10`;
        
        const [users] = await connection.execute(query);
        
        if (users.length === 0) {
          console.log(`  ❌ Not found`);
          results.notFound.push(staff.name);
          continue;
        }
        
        if (users.length > 1) {
          console.log(`  ⚠️  Multiple matches found (${users.length}):`);
          users.forEach((u, idx) => {
            console.log(`     ${idx + 1}. ${u.nama} (IC: ${u.ic})`);
          });
          // Use the first match
        }
        
        const user = users[0];
        const oldIC = user.ic;
        const normalizedOld = normalizeIC(oldIC);
        const normalizedNew = normalizeIC(staff.correctIC);
        
        console.log(`  Found: ${user.nama}`);
        console.log(`  Current IC: ${oldIC}`);
        
        // Check if already correct
        if (oldIC === staff.correctIC || normalizedOld === normalizedNew) {
          console.log(`  ✅ Already correct`);
          results.alreadyCorrect.push({ name: staff.name, ic: oldIC });
          continue;
        }
        
        // Collect all variations of old IC
        const oldICVariations = new Set([oldIC]);
        if (oldIC.startsWith('T')) {
          oldICVariations.add(oldIC.substring(1));
        }
        oldICVariations.add(normalizedOld);
        oldICVariations.add(oldIC.replace(/\D/g, ''));
        
        console.log(`  Updating from ${oldIC} to ${staff.correctIC}...`);
        
        // Update users table
        let usersUpdated = 0;
        for (const oldICVar of oldICVariations) {
          const [result] = await connection.execute(
            'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
            [staff.correctIC, oldICVar]
          );
          if (result.affectedRows > 0) {
            usersUpdated += result.affectedRows;
          }
        }
        
        if (usersUpdated === 0) {
          console.log(`  ⚠️  No users updated (might already be correct)`);
        } else {
          console.log(`  ✓ Updated ${usersUpdated} user(s)`);
        }
        
        // Update all related tables
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
                  [staff.correctIC, oldICVar]
                );
                if (result.affectedRows > 0) {
                  totalRows += result.affectedRows;
                }
              } catch (e) {
                // Table or column might not exist, skip
              }
            }
          }
        }
        
        if (totalRows > 0) {
          console.log(`  ✓ Updated ${totalRows} related row(s)`);
        }
        
        results.updated.push({ 
          name: staff.name, 
          oldIC: oldIC, 
          newIC: staff.correctIC,
          relatedRows: totalRows
        });
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.errors.push({ name: staff.name, error: error.message });
      }
    }
    
    await connection.commit();
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Updated: ${results.updated.length}`);
    console.log(`✓ Already correct: ${results.alreadyCorrect.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.updated.length > 0) {
      console.log('\nUpdated Staff:');
      results.updated.forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    ${r.oldIC} → ${r.newIC} (${r.relatedRows} related rows)`);
      });
    }
    
    if (results.alreadyCorrect.length > 0) {
      console.log('\nAlready Correct:');
      results.alreadyCorrect.forEach(r => {
        console.log(`  - ${r.name} (IC: ${r.ic})`);
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\nNot Found:');
      results.notFound.forEach(name => {
        console.log(`  - ${name}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ IC FIX COMPLETED');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    connection.release();
  }
};

fixAllStaffIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

