import { pool } from './config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractSchema() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    let schemaStr = `-- MyMasjidApp Complete Database Schema\n`;
    schemaStr += `-- Generated automatically from current working database\n\n`;
    
    schemaStr += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    for (const tableName of tableNames) {
      const [createTable] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      let ddl = createTable[0]['Create Table'];
      
      ddl = ddl.replace(/CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
      
      schemaStr += `-- Table structure for \`${tableName}\`\n`;
      schemaStr += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      schemaStr += `${ddl};\n\n`;
    }

    schemaStr += `SET FOREIGN_KEY_CHECKS=1;\n`;
    
    const dbPath = path.join(__dirname, '..', 'database');
    try { await fs.mkdir(dbPath, { recursive: true }); } catch (e) {}
    
    const outputPath = path.join(dbPath, 'masjid_app_complete_schema.sql');
    await fs.writeFile(outputPath, schemaStr, 'utf8');
    console.log('✅ Schema successfully extracted to ' + outputPath);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

extractSchema();
