import { pool } from '../config/database.js';

// Staff list with correct IC numbers from the image
// Format: { name: "FULL NAME", correctIC: "YYYYMMDD-XX-XXXX" }
// If name is an IC number, it means we'll search by current IC instead
const staffList = [
  { name: "TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH", correctIC: "731014-06-5251" },
  { name: "MUHAMMAD 'IZZAN BIN IDRIS", correctIC: "950717-06-5661" },
  { name: "ZANAL ABIDIN BIN ISMAIL", correctIC: "660322-06-5653" },
  { name: "A.ZUNNOR BIN ABD RAHMAN", correctIC: "710515-06-5193" }, // Also known as USTAZ ZUNNOR
  { name: "KHAIRUL AZZURA BINTI ISMAIL", correctIC: "701108-06-5175" },
  { name: "SYAHIRAH AISYAH BINTI SUFIAN", correctIC: "740101-06-5000" },
  { name: "MUHAMMAD IHSAN BIN MHD ZAHARI", correctIC: "720323-06-5059" },
  { name: "PUTRI ANATI BINTI AZAHAR", correctIC: "930929-06-5390" },
  { name: "NURUL SYAZWANI AISYAH BINTI RUSLI", correctIC: "911210-06-5097" },
  { name: "MOHAMAD SADIQ UMAIR BIN NAHAR", correctIC: "900102-06-6005" },
];

// Normalize IC: remove hyphens for comparison
const normalizeIC = (ic) => {
  if (!ic) return '';
  return String(ic).replace(/\D/g, '');
};

// Normalize name for comparison (remove extra spaces, convert to uppercase, remove titles)
const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, "'") // Normalize quotes
    // Remove common titles/prefixes
    .replace(/^(USTAZ|USTAZAH|TUAN|TUAN HAJI|HAJI|HAJAH|ENCIK|CIK|DR|DATO|DATUK|DATO'|DATUK'|TAN SRI|PUAN|PN)\s+/i, '')
    .trim();
};

// Find user by name (fuzzy matching)
const findUserByName = async (searchName) => {
  const normalizedSearch = normalizeName(searchName);
  
  // Get all users and normalize their names for comparison
  const [allUsers] = await pool.execute(
    'SELECT ic, nama FROM users'
  );
  
  // Try exact match with normalized names
  const exactMatches = allUsers.filter(user => {
    const normalizedUser = normalizeName(user.nama);
    return normalizedUser === normalizedSearch;
  });
  
  if (exactMatches.length > 0) {
    return exactMatches;
  }
  
  // Try partial match (contains) with normalized names
  const partialMatches = allUsers.filter(user => {
    const normalizedUser = normalizeName(user.nama);
    return normalizedUser.includes(normalizedSearch) || normalizedSearch.includes(normalizedUser);
  });
  
  if (partialMatches.length > 0) {
    return partialMatches;
  }
  
  // Try matching key parts of the name (last few words)
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 3);
  if (searchWords.length > 0) {
    const lastWords = searchWords.slice(-3).join(' '); // Last 3 significant words
    const wordMatches = allUsers.filter(user => {
      const normalizedUser = normalizeName(user.nama);
      return normalizedUser.includes(lastWords);
    });
    
    if (wordMatches.length > 0) {
      return wordMatches;
    }
  }
  
  return [];
};

// Find user by current IC (if name is actually an IC number)
const findUserByIC = async (ic) => {
  const normalizedIC = normalizeIC(ic);
  
  // Try exact match
  let [users] = await pool.execute(
    'SELECT ic, nama FROM users WHERE REPLACE(ic, "-", "") = ? OR ic = ?',
    [normalizedIC, ic]
  );
  
  return users;
};

// Update user IC
const updateUserIC = async (oldIC, newIC, userName) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Check if new IC already exists
    const [existingUsers] = await connection.execute(
      'SELECT ic, nama FROM users WHERE ic = ?',
      [newIC]
    );
    
    if (existingUsers.length > 0 && existingUsers[0].ic !== oldIC) {
      console.log(`⚠️  WARNING: New IC ${newIC} already exists for user: ${existingUsers[0].nama}`);
      await connection.rollback();
      return { success: false, message: `IC ${newIC} already exists` };
    }
    
    // Update users table
    await connection.execute(
      'UPDATE users SET ic = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [newIC, oldIC]
    );
    
    // Update related tables that reference user_ic
    const tablesToUpdate = [
      'students',
      'teachers',
      'user_roles',
      'attendance',
      'results',
      'fees',
      'payments'
    ];
    
    for (const table of tablesToUpdate) {
      try {
        // Check if table has user_ic column
        const [columns] = await connection.execute(
          `SHOW COLUMNS FROM ${table} LIKE 'user_ic'`
        );
        
        if (columns.length > 0) {
          await connection.execute(
            `UPDATE ${table} SET user_ic = ? WHERE user_ic = ?`,
            [newIC, oldIC]
          );
        }
        
        // Check for student_ic column
        const [studentColumns] = await connection.execute(
          `SHOW COLUMNS FROM ${table} LIKE 'student_ic'`
        );
        
        if (studentColumns.length > 0) {
          await connection.execute(
            `UPDATE ${table} SET student_ic = ? WHERE student_ic = ?`,
            [newIC, oldIC]
          );
        }
        
        // Check for guru_ic column (in classes table)
        if (table === 'classes') {
          const [guruColumns] = await connection.execute(
            `SHOW COLUMNS FROM ${table} LIKE 'guru_ic'`
          );
          
          if (guruColumns.length > 0) {
            await connection.execute(
              `UPDATE ${table} SET guru_ic = ? WHERE guru_ic = ?`,
              [newIC, oldIC]
            );
          }
        }
      } catch (error) {
        // Table might not exist or column might not exist, skip
        console.log(`  Skipping ${table} (might not exist or no matching column)`);
      }
    }
    
    await connection.commit();
    return { success: true, message: `Updated IC from ${oldIC} to ${newIC}` };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Main function
const updateStaffICNumbers = async () => {
  console.log('='.repeat(60));
  console.log('STAFF IC NUMBER UPDATE SCRIPT');
  console.log('='.repeat(60));
  
  try {
    // Test database connection
    console.log('\nTesting database connection...');
    const [test] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
  
  console.log('Starting IC number update process...');
  console.log(`Processing ${staffList.length} staff members\n`);
  
  const results = {
    updated: [],
    notFound: [],
    errors: [],
    skipped: []
  };
  
  for (const staff of staffList) {
    try {
      console.log(`\nProcessing: ${staff.name}`);
      console.log(`  Correct IC: ${staff.correctIC}`);
      
      // Check if "name" is actually an IC number (if we only have IC from image)
      let users = [];
      if (/^\d{6}-\d{2}-\d{4}$/.test(staff.name) || /^\d{12}$/.test(staff.name.replace(/\D/g, ''))) {
        // Name field contains an IC, search by IC instead
        console.log(`  Searching by current IC: ${staff.name}`);
        users = await findUserByIC(staff.name);
      } else {
        // Search by name
        users = await findUserByName(staff.name);
      }
      
      // If not found by name, try searching by the correct IC to see if user already has correct IC
      if (users.length === 0) {
        console.log(`  Not found by name, checking if user already has correct IC...`);
        const usersWithCorrectIC = await findUserByIC(staff.correctIC);
        if (usersWithCorrectIC.length > 0) {
          console.log(`  ✅ Found user with correct IC: ${usersWithCorrectIC[0].nama} (IC: ${usersWithCorrectIC[0].ic})`);
          results.skipped.push({ 
            name: staff.name, 
            correctIC: staff.correctIC, 
            currentIC: usersWithCorrectIC[0].ic,
            foundName: usersWithCorrectIC[0].nama,
            reason: 'User already has correct IC' 
          });
          continue;
        }
      }
      
      if (users.length === 0) {
        console.log(`  ❌ User not found`);
        results.notFound.push({ name: staff.name, correctIC: staff.correctIC });
        continue;
      }
      
      if (users.length > 1) {
        console.log(`  ⚠️  Multiple users found (${users.length}):`);
        users.forEach((u, idx) => {
          console.log(`    ${idx + 1}. ${u.nama} (IC: ${u.ic})`);
        });
        results.skipped.push({ 
          name: staff.name, 
          correctIC: staff.correctIC, 
          reason: 'Multiple matches found' 
        });
        continue;
      }
      
      const user = users[0];
      const currentIC = user.ic;
      const normalizedCurrent = normalizeIC(currentIC);
      const normalizedCorrect = normalizeIC(staff.correctIC);
      
      console.log(`  Found: ${user.nama}`);
      console.log(`  Current IC: ${currentIC}`);
      console.log(`  Current IC (normalized): ${normalizedCurrent}`);
      console.log(`  Correct IC: ${staff.correctIC}`);
      console.log(`  Correct IC (normalized): ${normalizedCorrect}`);
      
      // Check if current IC looks invalid (e.g., starts with T, wrong format)
      const isValidICFormat = /^\d{6}-\d{2}-\d{4}$/.test(currentIC) || /^\d{12}$/.test(normalizedCurrent);
      if (!isValidICFormat && normalizedCurrent.length !== 12) {
        console.log(`  ⚠️  Current IC format appears invalid (${currentIC}), will update to correct format`);
      }
      
      // Check if IC needs updating
      if (normalizedCurrent === normalizedCorrect && normalizedCurrent.length === 12) {
        console.log(`  ✅ IC already correct`);
        results.skipped.push({ 
          name: staff.name, 
          correctIC: staff.correctIC, 
          currentIC: currentIC,
          reason: 'IC already correct' 
        });
        continue;
      }
      
      // Check if this IC is already assigned to another user with different name
      const [existingWithIC] = await pool.execute(
        'SELECT ic, nama FROM users WHERE REPLACE(ic, "-", "") = ? AND REPLACE(ic, "-", "") != ?',
        [normalizedCorrect, normalizedCurrent]
      );
      
      if (existingWithIC.length > 0) {
        console.log(`  ⚠️  IC ${staff.correctIC} already exists for: ${existingWithIC[0].nama}`);
        console.log(`  This might be the same person with different name. Skipping to avoid duplicate.`);
        results.skipped.push({ 
          name: staff.name, 
          correctIC: staff.correctIC, 
          currentIC: currentIC,
          reason: `IC already exists for: ${existingWithIC[0].nama}` 
        });
        continue;
      }
      
      // Update IC
      console.log(`  Updating IC from ${currentIC} to ${staff.correctIC}...`);
      const updateResult = await updateUserIC(currentIC, staff.correctIC, user.nama);
      
      if (updateResult.success) {
        console.log(`  ✅ ${updateResult.message}`);
        results.updated.push({ 
          name: staff.name, 
          oldIC: currentIC, 
          newIC: staff.correctIC 
        });
      } else {
        console.log(`  ❌ ${updateResult.message}`);
        results.errors.push({ 
          name: staff.name, 
          correctIC: staff.correctIC, 
          error: updateResult.message 
        });
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${staff.name}:`, error.message);
      results.errors.push({ 
        name: staff.name, 
        correctIC: staff.correctIC, 
        error: error.message 
      });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${results.updated.length}`);
  console.log(`❌ Not Found: ${results.notFound.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.updated.length > 0) {
    console.log('\nUpdated Users:');
    results.updated.forEach(r => {
      console.log(`  - ${r.name}: ${r.oldIC} → ${r.newIC}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\nNot Found:');
    results.notFound.forEach(r => {
      console.log(`  - ${r.name} (should be IC: ${r.correctIC})`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\nSkipped:');
    results.skipped.forEach(r => {
      console.log(`  - ${r.name}: ${r.reason}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(0);
};

// Run the script
updateStaffICNumbers().catch((error) => {
  console.error('Fatal error:', error);
  console.error(error.stack);
  process.exit(1);
});

