import { pool } from '../config/database.js';

// Complete staff list with correct ICs from the image
const staffList = [
  { name: "TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH", correctIC: "731014-06-5251", searchTerms: ['RIZZAL', 'MOHD ALI NAFIAH'] },
  { name: "MUHAMMAD 'IZZAN BIN IDRIS", correctIC: "950717-06-5661", searchTerms: ['IZZAN', 'IDRIS'] },
  { name: "ZANAL ABIDIN BIN ISMAIL", correctIC: "660322-06-5653", searchTerms: ['ZANAL ABIDIN', 'ZANAL', 'ISMAIL'] },
  { name: "MOHD NOOR BIN DIN", correctIC: "710515-06-5193", searchTerms: ['NOOR BIN DIN', 'NOOR', 'DIN'] },
  { name: "A.ZUNNOR BIN ABD RAHMAN", correctIC: "710515-06-5193", searchTerms: ['ZUNNOR', 'ABD RAHMAN'] },
  { name: "KHAIRUL AZZURA BINTI ISMAIL", correctIC: "701108-06-5175", searchTerms: ['KHAIRUL AZZURA', 'KHAIRUL', 'ISMAIL'] },
  { name: "SYAHIRAH AISYAH BINTI SUFIAN", correctIC: "740101-06-5000", searchTerms: ['SYAHIRAH', 'SUFIAN'] },
  { name: "MUHAMMAD IHSAN BIN MHD ZAHARI", correctIC: "720323-06-5059", searchTerms: ['IHSAN', 'ZAHARI'] },
  { name: "PUTRI ANATI BINTI AZAHAR", correctIC: "930929-06-5390", searchTerms: ['PUTRI ANATI', 'AZAHAR'] },
  { name: "NURUL SYAZWANI AISYAH BINTI RUSLI", correctIC: "911210-06-5097", searchTerms: ['NURUL SYAZWANI', 'RUSLI'] },
  { name: "MOHAMAD SADIQ UMAIR BIN NAHAR", correctIC: "900102-06-6005", searchTerms: ['SADIQ UMAIR', 'NAHAR'] },
];

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

const replicateAndFixIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(70));
    console.log('REPLICATING STAFF DATA AND FIXING IC NUMBERS');
    console.log('Preserving all data (classes, roles, etc.) - Only updating IC');
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
        
        // Find user by name (fuzzy matching)
        const [allUsers] = await connection.execute('SELECT ic, nama, role, email, telefon, status FROM users');
        const normalizedSearch = normalizeName(staff.name);
        
        const matches = allUsers.filter(user => {
          const normalizedUser = normalizeName(user.nama);
          return normalizedUser === normalizedSearch || 
                 normalizedUser.includes(normalizedSearch) ||
                 normalizedSearch.includes(normalizedUser) ||
                 staff.searchTerms.some(term => normalizedUser.includes(term.toUpperCase()));
        });
        
        if (matches.length === 0) {
          console.log(`  ❌ Not found`);
          results.notFound.push(staff.name);
          continue;
        }
        
        if (matches.length > 1) {
          console.log(`  ⚠️  Multiple matches found (${matches.length}):`);
          matches.forEach((u, idx) => {
            console.log(`     ${idx + 1}. ${u.nama} (IC: ${u.ic}, Role: ${u.role})`);
          });
        }
        
        const user = matches[0];
        const oldIC = user.ic;
        const newIC = staff.correctIC;
        
        console.log(`  Found: ${user.nama}`);
        console.log(`  Current IC: ${oldIC}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Email: ${user.email || 'N/A'}`);
        console.log(`  Phone: ${user.telefon || 'N/A'}`);
        
        // Check if already correct
        if (oldIC === newIC || oldIC.replace(/\D/g, '') === newIC.replace(/\D/g, '')) {
          console.log(`  ✅ Already correct`);
          results.alreadyCorrect.push({ name: staff.name, ic: oldIC });
          continue;
        }
        
        // Collect all variations of old IC
        const oldICVariations = new Set([oldIC]);
        if (oldIC.startsWith('T')) {
          oldICVariations.add(oldIC.substring(1));
        }
        oldICVariations.add(oldIC.replace(/\D/g, ''));
        oldICVariations.add(oldIC.replace(/-/g, ''));
        
        console.log(`  Updating IC from ${oldIC} to ${newIC}...`);
        console.log(`  Old IC variations: ${Array.from(oldICVariations).join(', ')}`);
        
        // Step 1: Update users table (preserve all other data)
        let usersUpdated = 0;
        for (const oldICVar of oldICVariations) {
          const [result] = await connection.execute(
            'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
            [newIC, oldICVar]
          );
          if (result.affectedRows > 0) {
            usersUpdated += result.affectedRows;
          }
        }
        console.log(`  ✓ Updated ${usersUpdated} user(s) in users table`);
        
        // Step 2: Get all related data before updating
        const [classes] = await connection.execute('SELECT * FROM classes WHERE guru_ic = ?', [oldIC]);
        const [teachers] = await connection.execute('SELECT * FROM teachers WHERE user_ic = ?', [oldIC]);
        const [userRoles] = await connection.execute('SELECT * FROM user_roles WHERE user_ic = ?', [oldIC]);
        
        console.log(`  Found related data:`);
        console.log(`    - Classes: ${classes.length}`);
        console.log(`    - Teachers records: ${teachers.length}`);
        console.log(`    - User roles: ${userRoles.length}`);
        
        // Step 3: Update all related tables
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
                  console.log(`    ✓ ${table.name}.${column}: ${result.affectedRows} row(s)`);
                  totalRows += result.affectedRows;
                }
              } catch (e) {
                // Table or column might not exist, skip
              }
            }
          }
        }
        
        // Step 4: Verify the update preserved data
        const [verifyClasses] = await connection.execute('SELECT COUNT(*) as count FROM classes WHERE guru_ic = ?', [newIC]);
        const [verifyTeachers] = await connection.execute('SELECT COUNT(*) as count FROM teachers WHERE user_ic = ?', [newIC]);
        
        console.log(`  Verification:`);
        console.log(`    - Classes with new IC: ${verifyClasses[0].count}`);
        console.log(`    - Teachers records with new IC: ${verifyTeachers[0].count}`);
        
        if (verifyClasses[0].count === classes.length && verifyTeachers[0].count === teachers.length) {
          console.log(`  ✅ All data preserved successfully`);
        } else {
          console.log(`  ⚠️  Data count mismatch - some data might be missing`);
        }
        
        results.updated.push({ 
          name: staff.name, 
          oldIC: oldIC, 
          newIC: newIC,
          classes: classes.length,
          teachers: teachers.length,
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
      console.log('\nUpdated Staff (Data Preserved):');
      results.updated.forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    IC: ${r.oldIC} → ${r.newIC}`);
        console.log(`    Classes: ${r.classes}, Teachers records: ${r.teachers}`);
        console.log(`    Related rows updated: ${r.relatedRows}`);
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
    console.log('✅ DATA REPLICATION AND IC FIX COMPLETED');
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

replicateAndFixIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

