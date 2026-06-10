// services/databaseBackupService.js
import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function computeChecksum(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function computeSignature(filepath) {
  const content = fs.readFileSync(filepath);
  const secret = process.env.API_SIGNING_SECRET || 'default_secret';
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

async function ensureBackupLogsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS backup_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_name VARCHAR(500) NOT NULL,
      file_path VARCHAR(500),
      file_size INT DEFAULT 0,
      file_checksum VARCHAR(255),
      integrity_signature VARCHAR(255),
      trigger_type VARCHAR(50) DEFAULT 'manual',
      triggered_by VARCHAR(255),
      status VARCHAR(50) DEFAULT 'success',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function createAndUploadDatabaseBackup({ triggerType = 'manual', triggeredBy = null } = {}) {
  ensureBackupDir();
  await ensureBackupLogsTable();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const [tables] = await pool.execute('SHOW TABLES');
  const tableKey = Object.keys(tables[0] || {})[0];
  let sql = `-- MyMasjidApp Database Backup\n-- Created: ${new Date().toISOString()}\n-- Trigger: ${triggerType}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const tableRow of tables) {
    const tableName = tableRow[tableKey];
    const [[createResult]] = await pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n${createResult['Create Table']};\n\n`;

    const [rows] = await pool.execute(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      for (const row of rows) {
        const vals = Object.values(row).map(v =>
          v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
        ).join(', ');
        sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
      }
      sql += '\n';
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
  fs.writeFileSync(filePath, sql, 'utf8');

  const fileSize = fs.statSync(filePath).size;
  const fileChecksum = computeChecksum(filePath);
  const integritySignature = computeSignature(filePath);

  await pool.execute(
    `INSERT INTO backup_logs (file_name, file_path, file_size, file_checksum, integrity_signature, trigger_type, triggered_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
    [fileName, filePath, fileSize, fileChecksum, integritySignature, triggerType, triggeredBy]
  );

  return { fileName, filePath, fileSize, fileChecksum, integritySignature, triggerType, triggeredBy };
}

export async function getBackupHistory(limit = 10) {
  await ensureBackupLogsTable();
  const [rows] = await pool.execute(
    'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}

export async function getBackupLogByFileName(fileName) {
  await ensureBackupLogsTable();
  const [rows] = await pool.execute(
    'SELECT * FROM backup_logs WHERE file_name = ? LIMIT 1',
    [fileName]
  );
  return rows[0] || null;
}

export async function verifyBackupFileIntegrity({ fileName, expectedSignature, expectedChecksum } = {}) {
  const filePath = path.join(BACKUP_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: 'File not found on disk' };
  }
  const actualChecksum = computeChecksum(filePath);
  const actualSignature = computeSignature(filePath);
  const checksumMatch = actualChecksum === expectedChecksum;
  const signatureMatch = actualSignature === expectedSignature;
  return { valid: checksumMatch && signatureMatch, checksumMatch, signatureMatch, actualChecksum, actualSignature };
}

export async function createAndUploadYearlyArchive({ triggerType = 'yearly-archive', triggeredBy = null } = {}) {
  ensureBackupDir();
  await ensureBackupLogsTable();

  const year = new Date().getFullYear();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `archive_${year}_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const base = await createAndUploadDatabaseBackup({ triggerType, triggeredBy });
  if (fs.existsSync(base.filePath)) fs.copyFileSync(base.filePath, filePath);

  const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  const fileChecksum = fs.existsSync(filePath) ? computeChecksum(filePath) : '';
  const integritySignature = fs.existsSync(filePath) ? computeSignature(filePath) : '';

  await pool.execute(
    `INSERT INTO backup_logs (file_name, file_path, file_size, file_checksum, integrity_signature, trigger_type, triggered_by, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?)`,
    [fileName, filePath, fileSize, fileChecksum, integritySignature, triggerType, triggeredBy, `Yearly archive for ${year}`]
  );

  return { fileName, filePath, fileSize, fileChecksum, integritySignature, triggerType, triggeredBy, year };
}
