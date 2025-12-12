import { pool } from '../config/database.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';

/**
 * Normalize all phone numbers in the database to standard format
 * Format: 01X-XXXXXXX (for 10 digits) or 01X-XXXXXXXX (for 11 digits)
 */
const normalizeAllPhoneNumbers = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get all users with phone numbers
    const [users] = await connection.execute(`
      SELECT ic, nama, telefon 
      FROM users 
      WHERE telefon IS NOT NULL AND telefon != ''
    `);
    
    console.log(`Found ${users.length} users with phone numbers`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of users) {
      const normalized = normalizePhone(user.telefon);
      
      // Only update if the normalized value is different
      if (normalized && normalized !== user.telefon) {
        await connection.execute(
          'UPDATE users SET telefon = ? WHERE ic = ?',
          [normalized, user.ic]
        );
        console.log(`Updated ${user.nama} (IC: ${user.ic}): ${user.telefon} → ${normalized}`);
        updated++;
      } else {
        console.log(`Skipped ${user.nama} (IC: ${user.ic}): ${user.telefon} (already normalized or invalid)`);
        skipped++;
      }
    }
    
    await connection.commit();
    
    console.log('\n=== Normalization Complete ===');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error normalizing phone numbers:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Run the normalization
normalizeAllPhoneNumbers()
  .then(() => {
    console.log('Phone number normalization completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Phone number normalization failed:', error);
    process.exit(1);
  });

