import { pool } from '../config/database.js';

// Complete staff list from the image with correct ICs
const staffList = [
  { name: "TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH", correctIC: "731014-06-5251" },
  { name: "MUHAMMAD 'IZZAN BIN IDRIS", correctIC: "950717-06-5661" },
  { name: "ZANAL ABIDIN BIN ISMAIL", correctIC: "660322-06-5653" },
  { name: "A. ZUNNOR BIN ABD RAHMAN", correctIC: "710515-06-5193" },
  { name: "MOHD NOOR BIN DIN", correctIC: "701108-06-5175" },
  { name: "KHAIRUL AZZURA BINTI ISMAIL", correctIC: "740101-06-5000" },
  { name: "SHAIFUDDIN BIN NGAH", correctIC: "720323-06-5059" },
  { name: "SYAHIRAH AISYAH BINTI SUFIAN", correctIC: "930929-06-5390" },
  { name: "MUHAMMAD IHSAN BIN MHD ZAHARI", correctIC: "911210-06-5097" },
  { name: "MOHAMAD IZWANUDDIN BIN MOHD DAHALAN", correctIC: "900102-06-6005" },
  { name: "SYED FIRMAN SYAMIL BIN SYED AFFENDY", correctIC: "870526-06-5845" },
  { name: "AHMAD SHARIZAL BIN SAFFRIM", correctIC: "770704-06-5541" },
  { name: "MOHD HASBULLAH BIN ABDULLAH @ ISMAIL", correctIC: "811026-06-5435" },
  { name: "AMIR HASIF BIN HATA", correctIC: "920312-06-5113" },
  { name: "MUHAMMAD HAFIZUDDIN BIN TAJUDDIN", correctIC: "960505-06-5909" },
  { name: "MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ", correctIC: "951220-06-5759" },
  { name: "MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI", correctIC: "941218-07-5641" },
  { name: "PUTRI ANATI BINTI AZAHAR", correctIC: "921125-06-5606" },
  { name: "NURAIN NASUHA BINTI MOHD YUSOFF", correctIC: "951209-06-5192" },
  { name: "AHMAD HAYATUL FAIZ BIN ABD LATIF", correctIC: "931129-06-5047" },
  { name: "NABIJAH BINTI ZAKARIA", correctIC: "840714-02-5376" },
  { name: "NURUL SYAZWANI AISYAH BINTI RUSLI", correctIC: "911115-06-5216" },
  { name: "WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN", correctIC: "891003-06-5929" },
  { name: "MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI", correctIC: "990124-06-5179" },
  { name: "RUSDAN BIN ABDUL JALIL", correctIC: "720301-06-5533" },
  { name: "MOHAMMAD WAZAR BIN MOHD DAWI", correctIC: "691222-06-5287" },
  { name: "MOHAMAD SADIQ UMAIR BIN NAHAR", correctIC: "991002-01-6189" },
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

const fix27GuruIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING 27 GURU IC NUMBERS - FINAL VERSION');
    console.log('This will UPDATE existing entries to have correct ICs');
    console.log('='.repeat(80));
    console.log(`\nProcessing ${staffList.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    // Get all existing teachers
    const [allTeachers] = await connection.execute(`
      SELECT u.*, t.kepakaran 
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      WHERE u.role = 'teacher'
    `);
    
    console.log(`Found ${allTeachers.length} teachers in database\n`);
    
    const results = {
      updated: [],
      alreadyCorrect: [],
      notFound: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        console.log(`\n[${staff.name}]`);
        console.log(`  Target IC: ${staff.correctIC}`);
        
        // Find existing teacher by name
        const normalizedSearch = normalizeName(staff.name);
        const matches = allTeachers.filter(teacher => {
          const normalizedUser = normalizeName(teacher.nama);
          const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
          const userWords = normalizedUser.split(' ').filter(w => w.length > 2);
          
          if (normalizedUser === normalizedSearch) return true;
          
          const matchingWords = searchWords.filter(sw => 
            userWords.some(uw => uw.includes(sw) || sw.includes(uw))
          );
          if (matchingWords.length >= Math.min(3, searchWords.length)) return true;
          
          const searchKey = searchWords.slice(-3).join(' ');
          const userKey = userWords.slice(-3).join(' ');
          if (userKey.includes(searchKey) || searchKey.includes(userKey)) return true;
          
          return false;
        });
        
        if (matches.length === 0) {
          console.log(`  ❌ No matching teacher found`);
          results.notFound.push(staff.name);
          continue;
        }
        
        const teacher = matches[0];
        const oldIC = teacher.ic;
        const newIC = staff.correctIC;
        
        console.log(`  Found: ${teacher.nama}`);
        console.log(`  Current IC: ${oldIC}`);
        
        // Check if already correct (normalized)
        const oldICNormalized = String(oldIC).replace(/\D/g, '');
        const newICNormalized = String(newIC).replace(/\D/g, '');
        if (oldICNormalized === newICNormalized) {
          console.log(`  ✅ Already correct`);
          results.alreadyCorrect.push({ name: staff.name, ic: oldIC });
          continue;
        }
        
        // Check if new IC already exists
        const [existing] = await connection.execute(
          'SELECT * FROM users WHERE ic = ?',
          [newIC]
        );
        
        if (existing.length > 0 && existing[0].ic !== oldIC) {
          console.log(`  ⚠️  IC ${newIC} already exists for: ${existing[0].nama}`);
          console.log(`  Will update that entry and remove old one...`);
          
          // Delete old entry if it exists
          await connection.execute('DELETE FROM teachers WHERE user_ic = ?', [oldIC]);
          await connection.execute('DELETE FROM user_roles WHERE user_ic = ?', [oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [newIC, oldIC]);
          await connection.execute('DELETE FROM users WHERE ic = ?', [oldIC]);
          
          // Update existing entry with source data
          await connection.execute(
            `UPDATE users SET 
              nama = ?, email = ?, telefon = ?, status = ?, umur = ?, alamat = ?
             WHERE ic = ?`,
            [
              teacher.nama, teacher.email || null, teacher.telefon || null,
              teacher.status || 'aktif', teacher.umur || null, teacher.alamat || null,
              newIC
            ]
          );
          
          // Ensure teacher record exists
          const kepakaran = teacher.kepakaran || '[]';
          await connection.execute(
            'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?) ON DUPLICATE KEY UPDATE kepakaran = ?',
            [newIC, kepakaran, kepakaran]
          );
          
          results.updated.push({ name: staff.name, oldIC, newIC, action: 'merged' });
          console.log(`  ✅ Merged and updated`);
          continue;
        }
        
        // Update IC using ALTER TABLE workaround
        console.log(`  Updating IC from ${oldIC} to ${newIC}...`);
        
        // Step 1: Temporarily disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        try {
          // Step 2: Update all related tables first
          await connection.execute('UPDATE teachers SET user_ic = ? WHERE user_ic = ?', [newIC, oldIC]);
          await connection.execute('UPDATE classes SET guru_ic = ? WHERE guru_ic = ?', [newIC, oldIC]);
          await connection.execute('UPDATE user_roles SET user_ic = ? WHERE user_ic = ?', [newIC, oldIC]);
          
          // Update other related tables
          const relatedTables = ['attendance', 'results', 'fees', 'payments', 'students'];
          for (const table of relatedTables) {
            try {
              await connection.execute(`UPDATE ${table} SET user_ic = ? WHERE user_ic = ?`, [newIC, oldIC]);
            } catch (e) {
              // Skip if table/column doesn't exist
            }
          }
          
          // Step 3: Update users table (primary key)
          await connection.execute('UPDATE users SET ic = ? WHERE ic = ?', [newIC, oldIC]);
          
        } finally {
          // Step 4: Re-enable foreign key checks
          await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        }
        
        console.log(`  ✅ Updated IC successfully!`);
        results.updated.push({ name: staff.name, oldIC, newIC });
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
        results.errors.push({ name: staff.name, error: error.message });
      }
    }
    
    await connection.commit();
    
    // Get final count
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Final teacher count: ${finalCount[0].count}`);
    console.log(`✅ Updated: ${results.updated.length}`);
    console.log(`✓ Already correct: ${results.alreadyCorrect.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.updated.length > 0) {
      console.log('\n✅ UPDATED ICs:');
      results.updated.forEach(r => {
        console.log(`   ${r.name}`);
        console.log(`      ${r.oldIC} → ${r.newIC}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach(r => {
        console.log(`   ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETED');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    connection.release();
  }
};

fix27GuruIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

