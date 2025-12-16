import { pool } from '../config/database.js';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption.js';
import readline from 'readline';

/**
 * Encrypt Existing Data Script
 * 
 * WARNING: This script modifies production data!
 * - Always backup database before running
 * - Test on development environment first
 * - Run during low-traffic periods
 * 
 * This script encrypts sensitive fields in existing database records:
 * - User IC numbers
 * - Phone numbers
 * - Addresses
 * - Student guardian information
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Define sensitive fields to encrypt per table
const TABLES_TO_ENCRYPT = {
  users: ['ic', 'telefon', 'alamat'],
  students: ['ic', 'telefon', 'alamat', 'nama_wali', 'telefon_wali', 'alamat_wali'],
  teachers: ['ic', 'telefon', 'alamat'],
  // Add more tables as needed
};

async function encryptTableData(tableName, fields) {
  console.log(`\n🔐 Encrypting ${tableName} table...`);
  
  const connection = await pool.getConnection();
  let encrypted = 0;
  let skipped = 0;
  let failed = 0;
  
  try {
    await connection.beginTransaction();
    
    // Get all records from table
    const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
    
    console.log(`   Found ${rows.length} records`);
    
    for (const row of rows) {
      try {
        const updates = [];
        const values = [];
        let needsUpdate = false;
        
        // Check each field
        for (const field of fields) {
          const value = row[field];
          
          // Skip if null or empty
          if (!value || value === '') {
            continue;
          }
          
          // Skip if already encrypted
          if (isEncrypted(value)) {
            skipped++;
            continue;
          }
          
          // Encrypt the field
          const encryptedValue = encrypt(String(value));
          updates.push(`${field} = ?`);
          values.push(encryptedValue);
          needsUpdate = true;
        }
        
        // Update record if any fields were encrypted
        if (needsUpdate) {
          // Add ID to values for WHERE clause
          const idField = row.id ? 'id' : (row.ic ? 'ic' : 'id');
          values.push(row[idField]);
          
          const sql = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${idField} = ?`;
          await connection.execute(sql, values);
          
          encrypted++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to encrypt record:`, error.message);
        failed++;
      }
    }
    
    await connection.commit();
    
    console.log(`   ✅ ${encrypted} records encrypted`);
    console.log(`   ⏭️  ${skipped} fields already encrypted`);
    if (failed > 0) {
      console.log(`   ❌ ${failed} records failed`);
    }
    
    return { encrypted, skipped, failed };
  } catch (error) {
    await connection.rollback();
    console.error(`   ❌ Error encrypting ${tableName}:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

async function encryptExistingData() {
  console.log('═'.repeat(60));
  console.log('🔐 ENCRYPT EXISTING DATA');
  console.log('═'.repeat(60));
  console.log('\n⚠️  WARNING: This will encrypt sensitive data in your database!');
  console.log('⚠️  Make sure you have a backup before proceeding!\n');
  
  const proceed = await askQuestion('Do you want to continue? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled by user');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n📊 Starting encryption process...\n');
  
  let totalEncrypted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  try {
    // Encrypt each table
    for (const [tableName, fields] of Object.entries(TABLES_TO_ENCRYPT)) {
      try {
        // Check if table exists
        const [tables] = await pool.execute(
          `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (tables.length === 0) {
          console.log(`⏭️  Table ${tableName} does not exist, skipping...`);
          continue;
        }
        
        const result = await encryptTableData(tableName, fields);
        totalEncrypted += result.encrypted;
        totalSkipped += result.skipped;
        totalFailed += result.failed;
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error);
        totalFailed++;
      }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ENCRYPTION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Total records encrypted: ${totalEncrypted}`);
    console.log(`⏭️  Total fields skipped (already encrypted): ${totalSkipped}`);
    console.log(`❌ Total failures: ${totalFailed}`);
    console.log('═'.repeat(60) + '\n');
    
    if (totalFailed === 0) {
      console.log('✅ All data encrypted successfully!');
    } else {
      console.log('⚠️  Some records failed to encrypt. Check logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Encryption process failed:', error);
    throw error;
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run encryption
encryptExistingData()
  .then(() => {
    console.log('\n✅ Encryption process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Encryption process failed:', error);
    process.exit(1);
  });
