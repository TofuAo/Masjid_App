import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'masjid_app',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to database');

    // Run the migration SQL
    const sql = `
      ALTER TABLE users 
      MODIFY COLUMN status ENUM('aktif','tidak_aktif','cuti','pending') DEFAULT 'pending';
    `;

    await connection.execute(sql);
    console.log('✅ Migration successful: Added "pending" to status ENUM');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Migration already applied or column already exists');
      process.exit(0);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();

