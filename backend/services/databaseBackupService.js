import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import mysqldump from 'mysqldump';
import XLSX from 'xlsx';
import archiver from 'archiver';
import { uploadFileToDrive, ensureFolderExists } from '../utils/googleDriveClient.js';
import { pool } from '../config/database.js';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');

let backupTableEnsured = false;

async function ensureBackupDirectory() {
  await fsPromises.mkdir(BACKUP_DIR, { recursive: true });
}

async function ensureBackupTable() {
  if (backupTableEnsured) {
    return;
  }

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS backup_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT,
      drive_file_id VARCHAR(255),
      drive_view_link TEXT,
      drive_download_link TEXT,
      trigger_type VARCHAR(64) DEFAULT 'manual',
      triggered_by VARCHAR(100),
      status ENUM('success','failed') DEFAULT 'success',
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  await pool.execute(createTableSQL);
  backupTableEnsured = true;
}

function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'masjid_app',
    port: Number(process.env.DB_PORT) || 3306,
  };
}

function buildBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `masjid_app_backup_${timestamp}.sql`;
}

async function runMysqlDump(outputPath, { host, user, password, database, port }) {
  await mysqldump({
    connection: {
      host,
      user,
      password,
      database,
      port,
    },
    dumpToFile: outputPath,
    dump: {
      schema: {
        format: true,
      },
    },
  });
}

async function appendCsvTables({ host, user, password, database, port }, archive) {
  const [tables] = await pool.query('SHOW TABLES');
  const tableNameKey = `Tables_in_${database}`;
  const EXCEL_CELL_CHAR_LIMIT = 32767;

  const sanitizeValue = (value) => {
    if (value === null || value === undefined) return value;

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      return `[BLOB ${value.length} bytes]`;
    }

    if (typeof value === 'object') {
      try {
        const stringified = JSON.stringify(value);
        if (stringified.length > EXCEL_CELL_CHAR_LIMIT) {
          return `${stringified.slice(0, EXCEL_CELL_CHAR_LIMIT - 20)}... (truncated)`;
        }
        return stringified;
      } catch (error) {
        return '[object]';
      }
    }

    if (typeof value === 'string' && value.length > EXCEL_CELL_CHAR_LIMIT) {
      return `${value.slice(0, EXCEL_CELL_CHAR_LIMIT - 20)}... (truncated ${value.length - EXCEL_CELL_CHAR_LIMIT} chars)`;
    }

    return value;
  };

  for (const tableRow of tables) {
    const tableName = tableRow[tableNameKey] || Object.values(tableRow)[0];
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    const sanitizedRows = rows.map((row) => {
      const sanitized = {};
      for (const [key, value] of Object.entries(row)) {
        sanitized[key] = sanitizeValue(value);
      }
      return sanitized;
    });
    const worksheet = XLSX.utils.json_to_sheet(sanitizedRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    archive.append(csv, { name: `${tableName}.csv` });
  }
}

async function saveBackupLog(entry) {
  await ensureBackupTable();

  const {
    fileName,
    fileSize,
    driveFileId,
    viewLink,
    downloadLink,
    triggerType,
    triggeredBy,
    status,
    errorMessage,
  } = entry;

  const sql = `
    INSERT INTO backup_logs (
      file_name,
      file_size,
      drive_file_id,
      drive_view_link,
      drive_download_link,
      trigger_type,
      triggered_by,
      status,
      error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    fileName,
    fileSize || null,
    driveFileId || null,
    viewLink || null,
    downloadLink || null,
    triggerType || 'manual',
    triggeredBy || null,
    status || 'success',
    errorMessage || null,
  ];

  await pool.execute(sql, params);
}

export async function createAndUploadDatabaseBackup({ triggerType = 'manual', triggeredBy } = {}) {
  await ensureBackupDirectory();
  await ensureBackupTable();

  const dbConfig = getDatabaseConfig();
  const sqlFileName = buildBackupFileName();
  const sqlOutputPath = path.join(BACKUP_DIR, sqlFileName);
  const zipFileName = sqlFileName.replace('.sql', '.zip');
  const zipPath = path.join(BACKUP_DIR, zipFileName);
  const downloadUrl = `/api/export/download/${encodeURIComponent(zipFileName)}`;
  let zipStats;
  let driveResponse;
  let error;

  try {
    await runMysqlDump(sqlOutputPath, dbConfig);
    await new Promise(async (resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);

      archive.pipe(output);

      archive.append(fs.createReadStream(sqlOutputPath), { name: sqlFileName });

      await appendCsvTables(dbConfig, archive);

      archive.finalize();
    });

    zipStats = await fsPromises.stat(zipPath);

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    if (folderId && (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      await ensureFolderExists(folderId);
      driveResponse = await uploadFileToDrive(zipPath, {
        fileName: zipFileName,
        mimeType: 'application/zip',
        folderId,
      });
    }

    await saveBackupLog({
      fileName: zipFileName,
      fileSize: zipStats?.size || null,
      driveFileId: driveResponse?.id,
      viewLink: driveResponse?.webViewLink,
      downloadLink: driveResponse?.webContentLink || downloadUrl,
      triggerType,
      triggeredBy,
      status: 'success',
    });

    return {
      fileName: zipFileName,
      fileSize: zipStats?.size || null,
      driveFileId: driveResponse?.id,
      driveViewLink: driveResponse?.webViewLink,
      driveDownloadLink: driveResponse?.webContentLink,
      downloadUrl,
      localPath: zipPath,
      triggerType,
      triggeredBy,
    };
  } catch (err) {
    error = err;
    await saveBackupLog({
      fileName: zipFileName,
      fileSize: zipStats?.size || null,
      driveFileId: driveResponse?.id,
      viewLink: driveResponse?.webViewLink,
      downloadLink: driveResponse?.webContentLink || downloadUrl,
      triggerType,
      triggeredBy,
      status: 'failed',
      errorMessage: err.message,
    }).catch((logError) => {
      console.error('Failed to log backup failure:', logError);
    });
    throw err;
  } finally {
    const retainLocal = process.env.RETAIN_LOCAL_DATABASE_BACKUPS === 'true';
    if (!retainLocal) {
      await fsPromises.unlink(sqlOutputPath).catch(() => {});
    }
  }
}

export async function getBackupHistory(limit = 10) {
  await ensureBackupTable();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const [rows] = await pool.query(
    `SELECT id, file_name AS fileName, file_size AS fileSize, drive_file_id AS driveFileId,
      drive_view_link AS driveViewLink, drive_download_link AS driveDownloadLink,
      trigger_type AS triggerType, triggered_by AS triggeredBy, status, error_message AS errorMessage,
      created_at AS createdAt
    FROM backup_logs
    ORDER BY created_at DESC
    LIMIT ${safeLimit}`
  );
  return rows;
}


