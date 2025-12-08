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

const createStaffWithCorrectIC = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(70));
    console.log('CREATING STAFF WITH CORRECT IC NUMBERS');
    console.log('Copying all data from existing users, only changing IC');
    console.log('='.repeat(70));
    console.log(`\nProcessing ${staffList.length} staff members...\n`);
    
    await connection.beginTransaction();
    
    const results = {
      created: [],
      updated: [],
      notFound: [],
      errors: []
    };
    
    for (const staff of staffList) {
      try {
        console.log(`\n[${staff.name}]`);
        console.log(`  Target IC: ${staff.correctIC}`);
        
        // Step 1: Find existing user(s) with matching name
        const [allUsers] = await connection.execute('SELECT * FROM users');
        const normalizedSearch = normalizeName(staff.name);
        
        const matches = allUsers.filter(user => {
          const normalizedUser = normalizeName(user.nama);
          // Try multiple matching strategies
          const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
          const userWords = normalizedUser.split(' ').filter(w => w.length > 2);
          
          // Exact match
          if (normalizedUser === normalizedSearch) return true;
          
          // Check if most words match (at least 3 words match)
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
          console.log(`  ❌ No matching user found in database`);
          results.notFound.push(staff.name);
          continue;
        }
        
        if (matches.length > 1) {
          console.log(`  ⚠️  Multiple matches found (${matches.length}), using first match:`);
          matches.forEach((u, idx) => {
            console.log(`     ${idx + 1}. ${u.nama} (IC: ${u.ic}, Role: ${u.role})`);
          });
        }
        
        const sourceUser = matches[0];
        console.log(`  Found source: ${sourceUser.nama}`);
        console.log(`  Source IC: ${sourceUser.ic}`);
        console.log(`  Source Role: ${sourceUser.role}`);
        console.log(`  Source Email: ${sourceUser.email || 'N/A'}`);
        console.log(`  Source Phone: ${sourceUser.telefon || 'N/A'}`);
        
        // Step 2: Check if user with correct IC already exists
        const [existing] = await connection.execute(
          'SELECT * FROM users WHERE ic = ?',
          [staff.correctIC]
        );
        
        if (existing.length > 0) {
          console.log(`  ⚠️  User with IC ${staff.correctIC} already exists: ${existing[0].nama}`);
          console.log(`  Skipping - user already exists with correct IC`);
          results.updated.push({ name: staff.name, ic: staff.correctIC, action: 'already_exists' });
          continue;
        }
        
        // Step 2.5: Check if source IC is the same as target IC (normalized)
        const sourceICNormalized = sourceUser.ic.replace(/\D/g, '');
        const targetICNormalized = staff.correctIC.replace(/\D/g, '');
        if (sourceICNormalized === targetICNormalized) {
          console.log(`  ✅ IC already correct (normalized match)`);
          results.updated.push({ name: staff.name, ic: staff.correctIC, action: 'already_correct' });
          continue;
        }
        
        // Step 3: Create new user with correct IC, copying all data from source
        console.log(`  Creating new user with correct IC...`);
        
        // Hash password if exists, otherwise generate a default one
        let hashedPassword = sourceUser.password;
        if (!hashedPassword || hashedPassword.length === 0) {
          hashedPassword = await bcrypt.hash('Masjid123!', 12);
        }
        
        await connection.execute(
          `INSERT INTO users (ic, nama, email, telefon, password, role, status, umur, alamat, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            staff.correctIC,
            sourceUser.nama, // Keep original name
            sourceUser.email || null,
            sourceUser.telefon || null,
            hashedPassword,
            sourceUser.role || 'teacher',
            sourceUser.status || 'aktif',
            sourceUser.umur || null,
            sourceUser.alamat || null
          ]
        );
        console.log(`  ✓ Created new user with IC ${staff.correctIC}`);
        
        // Step 4: Copy all related data
        await copyRelatedData(connection, sourceUser.ic, staff.correctIC);
        
        results.created.push({ name: staff.name, ic: staff.correctIC, sourceIC: sourceUser.ic });
        
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
    console.log(`✅ Created: ${results.created.length}`);
    console.log(`✓ Updated: ${results.updated.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.created.length > 0) {
      console.log('\nCreated New Users:');
      results.created.forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    Source IC: ${r.sourceIC} → New IC: ${r.ic}`);
      });
    }
    
    if (results.updated.length > 0) {
      console.log('\nUpdated Existing Users:');
      results.updated.forEach(r => {
        console.log(`  - ${r.name} (IC: ${r.ic})`);
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\nNot Found in Database:');
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
    console.log('✅ STAFF CREATION WITH CORRECT IC COMPLETED');
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

const copyRelatedData = async (connection, oldIC, newIC) => {
  console.log(`  Copying related data from ${oldIC} to ${newIC}...`);
  
  // Copy teachers table data
  try {
    const [teachers] = await connection.execute('SELECT * FROM teachers WHERE user_ic = ?', [oldIC]);
    for (const teacher of teachers) {
      // Check if record already exists
      const [existing] = await connection.execute('SELECT * FROM teachers WHERE user_ic = ?', [newIC]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?)',
          [newIC, teacher.kepakaran]
        );
        console.log(`    ✓ Copied teachers record`);
      }
    }
  } catch (e) {
    // Table might not exist or error, skip
  }
  
  // Copy user_roles
  try {
    const [roles] = await connection.execute('SELECT * FROM user_roles WHERE user_ic = ?', [oldIC]);
    for (const role of roles) {
      const [existing] = await connection.execute(
        'SELECT * FROM user_roles WHERE user_ic = ? AND role = ?',
        [newIC, role.role]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO user_roles (user_ic, role) VALUES (?, ?)',
          [newIC, role.role]
        );
        console.log(`    ✓ Copied role: ${role.role}`);
      }
    }
  } catch (e) {
    // Skip if error
  }
  
  // Update classes to point to new IC
  try {
    const [result] = await connection.execute(
      'UPDATE classes SET guru_ic = ? WHERE guru_ic = ?',
      [newIC, oldIC]
    );
    if (result.affectedRows > 0) {
      console.log(`    ✓ Updated ${result.affectedRows} class(es) to use new IC`);
    }
  } catch (e) {
    // Skip if error
  }
  
  // Update students if they're linked through classes
  try {
    const [result] = await connection.execute(
      `UPDATE students s 
       INNER JOIN classes c ON s.kelas_id = c.id 
       SET s.user_ic = ? 
       WHERE c.guru_ic = ? AND s.user_ic = ?`,
      [newIC, newIC, oldIC]
    );
    if (result.affectedRows > 0) {
      console.log(`    ✓ Updated ${result.affectedRows} student link(s)`);
    }
  } catch (e) {
    // Skip if error
  }
};

createStaffWithCorrectIC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

