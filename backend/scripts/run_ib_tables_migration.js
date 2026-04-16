/**
 * Creates ib_action_logs and ib_document_flags if they don't exist.
 * Run: node backend/scripts/run_ib_tables_migration.js
 * Or from repo root with Docker: docker-compose exec backend node scripts/run_ib_tables_migration.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// From host: set DB_HOST=localhost, DB_PORT=3307 (or use .env). From Docker: DB_HOST=mysql, DB_PORT=3306.
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'masjid_user',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to database:', connectionConfig.database);

    const sqlPath = path.join(__dirname, '../../database/migration_ib_tables_ensure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        await connection.query(statement);
        console.log('Executed:', statement.substring(0, 60).replace(/\n/g, ' ') + '...');
      }
    }

    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('ib_action_logs','ib_document_flags')",
      [connectionConfig.database]
    );
    console.log('✅ IB tables OK:', tables.map(t => t.TABLE_NAME).join(', '));
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message || error);
    if (error.code) console.error('Code:', error.code);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
