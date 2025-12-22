import { pool } from '../config/database.js';

/**
 * Check if IC is in valid format (12 digits, with or without hyphens)
 */
const isValidICFormat = (ic) => {
  if (!ic) return false;
  const cleaned = ic.toString().replace(/[-\s]/g, '');
  return /^\d{12}$/.test(cleaned);
};

/**
 * Generate a random 12-digit IC number
 */
const generateRandomIC = () => {
  // Generate a random 12-digit number
  // Format: XXXXXX-XX-XXXX (12 digits total)
  const digits = Math.floor(Math.random() * 900000000000) + 100000000000; // 12 digits
  const icString = digits.toString();
  return `${icString.substring(0, 6)}-${icString.substring(6, 8)}-${icString.substring(8, 12)}`;
};

/**
 * Fix invalid ICs in the database
 */
const fixInvalidICs = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Fetching all users...');
    const [users] = await connection.execute(
      'SELECT ic, nama, email, telefon, role, status, umur, alamat, password, created_at FROM users'
    );
    
    console.log(`Found ${users.length} users. Checking IC formats...`);
    
    const invalidUsers = users.filter(user => !isValidICFormat(user.ic));
    console.log(`Found ${invalidUsers.length} users with invalid IC formats:`);
    
    for (const user of invalidUsers) {
      console.log(`\nProcessing user: ${user.nama} (IC: ${user.ic}, Role: ${user.role})`);
      
      // Generate new valid IC
      let newIC = generateRandomIC();
      
      // Ensure the new IC doesn't already exist
      let attempts = 0;
      let [existing] = await connection.execute('SELECT ic FROM users WHERE ic = ?', [newIC]);
      while (existing.length > 0 && attempts < 10) {
        newIC = generateRandomIC();
        [existing] = await connection.execute('SELECT ic FROM users WHERE ic = ?', [newIC]);
        attempts++;
      }
      
      if (attempts >= 10) {
        console.error(`Failed to generate unique IC after 10 attempts for user: ${user.nama}`);
        continue;
      }
      
      console.log(`  Generated new IC: ${newIC}`);
      
      // Check if this user has related records
      const [studentRecords] = await connection.execute(
        'SELECT * FROM students WHERE user_ic = ?',
        [user.ic]
      );
      
      const [teacherRecords] = await connection.execute(
        'SELECT * FROM teachers WHERE user_ic = ?',
        [user.ic]
      );
      
      const [userRoles] = await connection.execute(
        'SELECT * FROM user_roles WHERE user_ic = ?',
        [user.ic]
      );
      
      // Update user IC
      console.log(`  Updating user IC from ${user.ic} to ${newIC}`);
      await connection.execute(
        'UPDATE users SET ic = ? WHERE ic = ?',
        [newIC, user.ic]
      );
      
      // Update related records
      if (studentRecords.length > 0) {
        console.log(`  Updating ${studentRecords.length} student record(s)`);
        await connection.execute(
          'UPDATE students SET user_ic = ? WHERE user_ic = ?',
          [newIC, user.ic]
        );
      }
      
      if (teacherRecords.length > 0) {
        console.log(`  Updating ${teacherRecords.length} teacher record(s)`);
        await connection.execute(
          'UPDATE teachers SET user_ic = ? WHERE user_ic = ?',
          [newIC, user.ic]
        );
      }
      
      if (userRoles.length > 0) {
        console.log(`  Updating ${userRoles.length} user_role record(s)`);
        await connection.execute(
          'UPDATE user_roles SET user_ic = ? WHERE user_ic = ?',
          [newIC, user.ic]
        );
      }
      
      // Update foreign key references
      const tablesToUpdate = [
        { table: 'classes', column: 'guru_ic' },
        { table: 'attendance', column: 'student_ic' },
        { table: 'attendance', column: 'marked_by' },
        { table: 'attendance', column: 'confirmed_by' },
        { table: 'fees', column: 'student_ic' },
        { table: 'results', column: 'student_ic' },
        { table: 'pending_pic_changes', column: 'created_by' },
        { table: 'pending_pic_changes', column: 'approved_by' },
        { table: 'admin_action_snapshots', column: 'actor_ic' }
      ];
      
      for (const { table, column } of tablesToUpdate) {
        try {
          const [result] = await connection.execute(
            `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
            [newIC, user.ic]
          );
          if (result.affectedRows > 0) {
            console.log(`  Updated ${result.affectedRows} record(s) in ${table}.${column}`);
          }
        } catch (error) {
          // Table or column might not exist, skip silently
          if (!error.message.includes("doesn't exist")) {
            console.warn(`  Warning: Could not update ${table}.${column}:`, error.message);
          }
        }
      }
      
      console.log(`  ✓ Successfully updated user ${user.nama} (${user.ic} → ${newIC})`);
    }
    
    await connection.commit();
    console.log(`\n✓ Successfully fixed ${invalidUsers.length} users with invalid IC formats.`);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error fixing invalid ICs:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

// Run the script
fixInvalidICs()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

