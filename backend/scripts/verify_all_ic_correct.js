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

const normalizeIC = (ic) => {
  if (!ic) return '';
  return String(ic).replace(/\D/g, '');
};

const verifyAllIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('VERIFYING ALL IC NUMBERS AGAINST IMAGE DATA');
    console.log('='.repeat(80));
    console.log(`\nChecking ${staffList.length} staff members...\n`);
    
    // Get all users from database
    const [allUsers] = await connection.execute('SELECT ic, nama, role, email, telefon FROM users');
    
    const results = {
      correct: [],
      incorrect: [],
      notFound: [],
      multipleFound: []
    };
    
    for (const staff of staffList) {
      const normalizedSearch = normalizeName(staff.name);
      const correctICNormalized = normalizeIC(staff.correctIC);
      
      // Find matching users by name
      const matches = allUsers.filter(user => {
        const normalizedUser = normalizeName(user.nama);
        const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
        const userWords = normalizedUser.split(' ').filter(w => w.length > 2);
        
        // Exact match
        if (normalizedUser === normalizedSearch) return true;
        
        // Check if most words match
        const matchingWords = searchWords.filter(sw => 
          userWords.some(uw => uw.includes(sw) || sw.includes(uw))
        );
        if (matchingWords.length >= Math.min(3, searchWords.length)) return true;
        
        // Check key parts (last 2-3 words)
        const searchKey = searchWords.slice(-3).join(' ');
        const userKey = userWords.slice(-3).join(' ');
        if (userKey.includes(searchKey) || searchKey.includes(userKey)) return true;
        
        return false;
      });
      
      if (matches.length === 0) {
        console.log(`❌ NOT FOUND: ${staff.name}`);
        console.log(`   Expected IC: ${staff.correctIC}`);
        results.notFound.push({ name: staff.name, correctIC: staff.correctIC });
        continue;
      }
      
      if (matches.length > 1) {
        console.log(`⚠️  MULTIPLE MATCHES: ${staff.name}`);
        console.log(`   Expected IC: ${staff.correctIC}`);
        matches.forEach((u, idx) => {
          const userICNormalized = normalizeIC(u.ic);
          const isCorrect = userICNormalized === correctICNormalized;
          console.log(`   ${idx + 1}. ${u.nama} (IC: ${u.ic}) ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
        });
        results.multipleFound.push({ name: staff.name, matches, correctIC: staff.correctIC });
        continue;
      }
      
      const user = matches[0];
      const userICNormalized = normalizeIC(user.ic);
      const isCorrect = userICNormalized === correctICNormalized;
      
      if (isCorrect) {
        console.log(`✅ CORRECT: ${user.nama}`);
        console.log(`   IC: ${user.ic} (matches expected: ${staff.correctIC})`);
        results.correct.push({ name: staff.name, user: user.nama, ic: user.ic });
      } else {
        console.log(`❌ INCORRECT: ${user.nama}`);
        console.log(`   Current IC: ${user.ic}`);
        console.log(`   Expected IC: ${staff.correctIC}`);
        results.incorrect.push({ 
          name: staff.name, 
          user: user.nama, 
          currentIC: user.ic, 
          correctIC: staff.correctIC 
        });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Correct IC: ${results.correct.length}`);
    console.log(`❌ Incorrect IC: ${results.incorrect.length}`);
    console.log(`⚠️  Multiple matches: ${results.multipleFound.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`\nTotal checked: ${staffList.length}`);
    
    if (results.correct.length > 0) {
      console.log('\n✅ CORRECT IC NUMBERS:');
      results.correct.forEach(r => {
        console.log(`   ${r.user} → ${r.ic}`);
      });
    }
    
    if (results.incorrect.length > 0) {
      console.log('\n❌ INCORRECT IC NUMBERS (NEEDS FIXING):');
      results.incorrect.forEach(r => {
        console.log(`   ${r.user}`);
        console.log(`      Current: ${r.currentIC}`);
        console.log(`      Should be: ${r.correctIC}`);
      });
    }
    
    if (results.multipleFound.length > 0) {
      console.log('\n⚠️  MULTIPLE MATCHES FOUND:');
      results.multipleFound.forEach(r => {
        console.log(`   ${r.name}`);
        r.matches.forEach((m, idx) => {
          const mICNormalized = normalizeIC(m.ic);
          const correctICNormalized = normalizeIC(r.correctIC);
          const isCorrect = mICNormalized === correctICNormalized;
          console.log(`      ${idx + 1}. ${m.nama} (IC: ${m.ic}) ${isCorrect ? '✅' : '❌'}`);
        });
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\n❌ NOT FOUND IN DATABASE:');
      results.notFound.forEach(r => {
        console.log(`   ${r.name} (Expected IC: ${r.correctIC})`);
      });
    }
    
    // Check for users with correct ICs but different names
    console.log('\n' + '='.repeat(80));
    console.log('CHECKING USERS WITH CORRECT ICs BUT DIFFERENT NAMES');
    console.log('='.repeat(80));
    
    const allCorrectICs = staffList.map(s => s.correctIC);
    const [usersWithCorrectIC] = await connection.execute(
      `SELECT ic, nama, role FROM users WHERE ic IN (${allCorrectICs.map(() => '?').join(',')})`,
      allCorrectICs
    );
    
    console.log(`\nFound ${usersWithCorrectIC.length} users with correct ICs:\n`);
    usersWithCorrectIC.forEach(user => {
      const matchingStaff = staffList.find(s => normalizeIC(s.correctIC) === normalizeIC(user.ic));
      if (matchingStaff) {
        const nameMatch = normalizeName(user.nama) === normalizeName(matchingStaff.name);
        console.log(`${nameMatch ? '✅' : '⚠️'} ${user.nama}`);
        console.log(`   IC: ${user.ic}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        if (!nameMatch) {
          console.log(`   Expected name: ${matchingStaff.name}`);
        }
        console.log('');
      }
    });
    
    console.log('='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    // Return summary for potential fixing
    return {
      needsFixing: results.incorrect.length > 0 || results.notFound.length > 0,
      summary: results
    };
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    connection.release();
  }
};

// Ensure output is not buffered
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

verifyAllIC()
  .then((result) => {
    if (result.needsFixing) {
      console.log('\n⚠️  Some ICs need to be fixed. Consider running the fix_incorrect_ic.js script.');
      process.exit(1);
    } else {
      console.log('\n✅ All ICs are correct!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });

