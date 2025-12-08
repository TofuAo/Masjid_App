import { pool } from '../config/database.js';

// Staff list with correct ICs from image
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

const normalizeIC = (ic) => {
  if (!ic) return '';
  return String(ic).replace(/\D/g, '');
};

const fixIncorrectIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING INCORRECT IC NUMBERS');
    console.log('='.repeat(80));
    console.log(`\nProcessing ${staffList.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    const [allUsers] = await connection.execute('SELECT * FROM users');
    const results = {
      fixed: [],
      alreadyCorrect: [],
      notFound: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        const normalizedSearch = normalizeName(staff.name);
        const correctICNormalized = normalizeIC(staff.correctIC);
        
        // Find matching users
        const matches = allUsers.filter(user => {
          const normalizedUser = normalizeName(user.nama);
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
          console.log(`❌ NOT FOUND: ${staff.name}`);
          results.notFound.push(staff.name);
          continue;
        }
        
        const user = matches[0];
        const userICNormalized = normalizeIC(user.ic);
        
        if (userICNormalized === correctICNormalized) {
          console.log(`✅ CORRECT: ${user.nama} (IC: ${user.ic})`);
          results.alreadyCorrect.push({ name: staff.name, ic: user.ic });
          continue;
        }
        
        console.log(`🔧 FIXING: ${user.nama}`);
        console.log(`   Current IC: ${user.ic} → Correct IC: ${staff.correctIC}`);
        
        const oldIC = user.ic;
        const newIC = staff.correctIC;
        
        // Check if correct IC already exists
        const [existing] = await connection.execute('SELECT * FROM users WHERE ic = ?', [newIC]);
        if (existing.length > 0 && existing[0].ic !== oldIC) {
          console.log(`   ⚠️  IC ${newIC} already exists for: ${existing[0].nama}`);
          console.log(`   Skipping to avoid duplicate...`);
          continue;
        }
        
        // Update users table
        await connection.execute(
          'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
          [newIC, oldIC]
        );
        
        // Update all related tables
        const tables = [
          { table: 'teachers', column: 'user_ic' },
          { table: 'students', column: 'user_ic' },
          { table: 'classes', column: 'guru_ic' },
          { table: 'user_roles', column: 'user_ic' },
          { table: 'attendance', column: 'user_ic' },
          { table: 'results', column: 'user_ic' },
          { table: 'fees', column: 'user_ic' },
          { table: 'payments', column: 'user_ic' }
        ];
        
        for (const { table, column } of tables) {
          try {
            const [result] = await connection.execute(
              `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
              [newIC, oldIC]
            );
            if (result.affectedRows > 0) {
              console.log(`   ✓ Updated ${result.affectedRows} record(s) in ${table}`);
            }
          } catch (e) {
            // Table or column might not exist, skip
          }
        }
        
        results.fixed.push({ name: staff.name, oldIC, newIC });
        console.log(`   ✅ Fixed!\n`);
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.errors.push({ name: staff.name, error: error.message });
      }
    }
    
    await connection.commit();
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Fixed: ${results.fixed.length}`);
    console.log(`✓ Already correct: ${results.alreadyCorrect.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.fixed.length > 0) {
      console.log('\n✅ FIXED ICs:');
      results.fixed.forEach(r => {
        console.log(`   ${r.name}`);
        console.log(`      ${r.oldIC} → ${r.newIC}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ IC FIXING COMPLETED');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

fixIncorrectIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

