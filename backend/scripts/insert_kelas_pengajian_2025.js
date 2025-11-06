// Script to insert Kelas Pengajian 2025 data
// This script reads the SQL file and executes it, or can be run directly

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'masjid_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function insertKelasPengajian() {
  let connection;
  
  try {
    console.log('📚 Starting Kelas Pengajian 2025 data insertion...\n');
    
    connection = await pool.getConnection();
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, '../../database/migration_insert_kelas_pengajian_2025.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Remove comments and clean up the SQL
    const cleanedSql = sql
      .split('\n')
      .map(line => {
        // Remove full-line comments
        if (line.trim().startsWith('--')) {
          return '';
        }
        // Remove inline comments (keep the SQL part)
        const commentIndex = line.indexOf('--');
        if (commentIndex > 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');
    
    // Split by semicolon and execute each statement
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filter out empty statements, comments, and USE statements
        return s.length > 0 && 
               !s.toLowerCase().startsWith('use ') &&
               !s.startsWith('--') &&
               s.length > 10; // Minimum statement length
      });
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.query(statement + ';');
        successCount++;
        if ((i + 1) % 10 === 0 || i === statements.length - 1) {
          console.log(`✅ Processed ${i + 1}/${statements.length} statements...`);
        }
      } catch (error) {
        errorCount++;
        // Some errors are expected (like duplicate keys)
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Statement ${i + 1}: Duplicate entry (skipping)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }
    
    console.log(`\n✅ Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Errors encountered: ${errorCount} statements`);
    }
    
    console.log('\n✅ Data insertion completed!');
    
    // Verify data
    const [classes] = await connection.query('SELECT COUNT(*) as count FROM classes');
    const [teachers] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Classes created: ${classes[0].count}`);
    console.log(`   - Teachers: ${teachers[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// Run the migration
insertKelasPengajian();

