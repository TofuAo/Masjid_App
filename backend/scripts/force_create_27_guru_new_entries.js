import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

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

const forceCreate27Guru = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('FORCE CREATING 27 GURU WITH CORRECT IC NUMBERS');
    console.log('This will CREATE NEW entries even if correct IC already exists');
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
    
    const initialCount = allTeachers.length;
    console.log(`Initial teacher count: ${initialCount}\n`);
    
    const results = {
      created: [],
      skipped: [],
      notFound: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        console.log(`\n[${staff.name}]`);
        console.log(`  Target IC: ${staff.correctIC}`);
        
        // Step 1: Find existing teacher by name (fuzzy matching)
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
          console.log(`  ❌ No matching teacher found in database`);
          results.notFound.push(staff.name);
          continue;
        }
        
        const sourceTeacher = matches[0];
        console.log(`  Found source: ${sourceTeacher.nama}`);
        console.log(`  Source IC: ${sourceTeacher.ic}`);
        
        // Step 2: Check if source IC is already the correct IC (normalized)
        const sourceICNormalized = String(sourceTeacher.ic).replace(/\D/g, '');
        const targetICNormalized = String(staff.correctIC).replace(/\D/g, '');
        if (sourceICNormalized === targetICNormalized) {
          console.log(`  ✅ Source IC already matches target IC`);
          results.skipped.push({ name: staff.name, ic: staff.correctIC, reason: 'already_correct' });
          continue;
        }
        
        // Step 3: Check if user with correct IC already exists
        const [existing] = await connection.execute(
          'SELECT * FROM users WHERE ic = ?',
          [staff.correctIC]
        );
        
        if (existing.length > 0) {
          console.log(`  ⚠️  User with IC ${staff.correctIC} already exists: ${existing[0].nama}`);
          console.log(`  Skipping - correct IC already exists in database`);
          results.skipped.push({ name: staff.name, ic: staff.correctIC, reason: 'already_exists' });
          continue;
        }
        
        // Step 4: Create NEW user with correct IC
        console.log(`  Creating NEW user with correct IC...`);
        
        // Hash password if exists, otherwise generate a default one
        let hashedPassword = sourceTeacher.password;
        if (!hashedPassword || hashedPassword.length === 0) {
          hashedPassword = await bcrypt.hash('Masjid123!', 12);
        }
        
        // Create new user record
        await connection.execute(
          `INSERT INTO users (ic, nama, email, telefon, password, role, status, umur, alamat, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            staff.correctIC,
            sourceTeacher.nama,
            sourceTeacher.email || null,
            sourceTeacher.telefon || null,
            hashedPassword,
            sourceTeacher.role || 'teacher',
            sourceTeacher.status || 'aktif',
            sourceTeacher.umur || null,
            sourceTeacher.alamat || null
          ]
        );
        console.log(`  ✓ Created new user with IC ${staff.correctIC}`);
        
        // Step 5: Copy teacher record
        const kepakaran = sourceTeacher.kepakaran || '[]';
        await connection.execute(
          'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?)',
          [staff.correctIC, kepakaran]
        );
        console.log(`  ✓ Copied teacher record`);
        
        // Step 6: Update classes to point to new IC (keep old IC entries too)
        const [classesResult] = await connection.execute(
          'UPDATE classes SET guru_ic = ? WHERE guru_ic = ?',
          [staff.correctIC, sourceTeacher.ic]
        );
        if (classesResult.affectedRows > 0) {
          console.log(`  ✓ Updated ${classesResult.affectedRows} class(es) to use new IC`);
        }
        
        // Step 7: Copy user_roles if any
        const [roles] = await connection.execute(
          'SELECT * FROM user_roles WHERE user_ic = ?',
          [sourceTeacher.ic]
        );
        for (const role of roles) {
          await connection.execute(
            'INSERT INTO user_roles (user_ic, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = ?',
            [staff.correctIC, role.role, role.role]
          );
        }
        
        results.created.push({ 
          name: staff.name, 
          sourceIC: sourceTeacher.ic, 
          newIC: staff.correctIC 
        });
        
        console.log(`  ✅ Successfully created new user!`);
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.errors.push({ name: staff.name, error: error.message });
      }
    }
    
    await connection.commit();
    
    // Get final count
    const [finalTeachers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    const finalCount = finalTeachers[0].count;
    const newEntries = finalCount - initialCount;
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Initial teacher count: ${initialCount}`);
    console.log(`Final teacher count: ${finalCount}`);
    console.log(`New entries created: ${newEntries}`);
    console.log(`✅ Created: ${results.created.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.created.length > 0) {
      console.log('\n✅ CREATED NEW USERS:');
      results.created.forEach(r => {
        console.log(`   ${r.name}`);
        console.log(`      ${r.sourceIC} → ${r.newIC}`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n⚠️  SKIPPED:');
      results.skipped.forEach(r => {
        console.log(`   ${r.name} (IC: ${r.ic}) - ${r.reason}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETED');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

forceCreate27Guru()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

