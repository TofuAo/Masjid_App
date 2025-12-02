import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createHash, createHmac } from 'crypto';
import mysqldump from 'mysqldump';
import XLSX from 'xlsx';
import archiver from 'archiver';
import { uploadFileToDrive, ensureFolderExists } from '../utils/googleDriveClient.js';
import { pool } from '../config/database.js';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const CHECKSUM_ALGORITHM = process.env.BACKUP_CHECKSUM_ALGO || 'sha256';
const SIGNATURE_ALGORITHM = process.env.BACKUP_SIGNATURE_ALGO || 'sha256';
const INTEGRITY_SECRET =
  process.env.BACKUP_INTEGRITY_SECRET ||
  process.env.JWT_SECRET ||
  'masjid-app-backup-integrity-secret';

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
      file_checksum VARCHAR(128),
      integrity_signature VARCHAR(128),
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

async function computeFileChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash(CHECKSUM_ALGORITHM);
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => {
      hash.update(chunk);
    });
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
}

function buildIntegritySignature(fileName, checksum) {
  const hmac = createHmac(SIGNATURE_ALGORITHM, INTEGRITY_SECRET);
  hmac.update(`${fileName}|${checksum}`);
  return hmac.digest('hex');
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
    fileChecksum,
    integritySignature,
  } = entry;

  const sql = `
    INSERT INTO backup_logs (
      file_name,
      file_size,
      file_checksum,
      integrity_signature,
      drive_file_id,
      drive_view_link,
      drive_download_link,
      trigger_type,
      triggered_by,
      status,
      error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    fileName,
    fileSize || null,
    fileChecksum || null,
    integritySignature || null,
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
  let fileChecksum;
  let integritySignature;

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
    fileChecksum = await computeFileChecksum(zipPath);
    integritySignature = buildIntegritySignature(zipFileName, fileChecksum);

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
      fileChecksum,
      integritySignature,
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
      checksum: fileChecksum,
      integritySignature,
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
      fileChecksum,
      integritySignature,
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
    `SELECT id, file_name AS fileName, file_size AS fileSize,
      file_checksum AS fileChecksum,
      integrity_signature AS integritySignature,
      drive_file_id AS driveFileId,
      drive_view_link AS driveViewLink,
      drive_download_link AS driveDownloadLink,
      trigger_type AS triggerType,
      triggered_by AS triggeredBy,
      status,
      error_message AS errorMessage,
      created_at AS createdAt
    FROM backup_logs
    ORDER BY created_at DESC
    LIMIT ${safeLimit}`
  );
  return rows;
}

// Archive 1 year of data
async function appendYearlyCsvTables({ host, user, password, database, port }, archive, startDate, endDate) {
  const [tables] = await pool.query('SHOW TABLES');
  const tableNameKey = `Tables_in_${database}`;
  const EXCEL_CELL_CHAR_LIMIT = 32767;

  // Define date columns for each table
  const dateColumns = {
    attendance: 'tarikh',
    payments: 'created_at',
    yuran: 'created_at',
    fees: 'created_at',
    transactions: 'created_at',
    check_ins: 'created_at',
    logs: 'created_at',
    backup_logs: 'created_at',
  };

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
    
    // Skip system tables
    if (tableName.startsWith('_') || tableName.includes('schema') || tableName.includes('migration')) {
      continue;
    }

    const dateColumn = dateColumns[tableName];
    let rows;

    // Filter by date if table has a date column and date range is provided
    if (dateColumn && startDate && endDate) {
      try {
        // Check if column exists
        const [columns] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE '${dateColumn}'`);
        if (columns.length > 0) {
          // Column exists, filter by date
          [rows] = await pool.query(
            `SELECT * FROM \`${tableName}\` WHERE \`${dateColumn}\` >= ? AND \`${dateColumn}\` <= ?`,
            [startDate, endDate]
          );
        } else {
          // Column doesn't exist, get all rows
          [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
        }
      } catch (err) {
        // If date filtering fails, get all rows
        console.warn(`Could not filter ${tableName} by date:`, err.message);
        [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      }
    } else {
      // No date filtering, get all rows
      [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    }

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

export async function createAndUploadYearlyArchive({ triggerType = 'yearly-archive', triggeredBy } = {}) {
  await ensureBackupDirectory();
  await ensureBackupTable();

  // Calculate date range: 1 year ago to today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const year = startDate.getFullYear();

  const dbConfig = getDatabaseConfig();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const zipFileName = `masjid_app_archive_${year}_${timestamp}.zip`;
  const zipPath = path.join(BACKUP_DIR, zipFileName);
  const downloadUrl = `/api/export/download/${encodeURIComponent(zipFileName)}`;
  let zipStats;
  let driveResponse;
  let error;

  try {
    // Create archive info file
    const archiveInfo = {
      archiveType: 'yearly',
      year: year,
      startDate: startDateStr,
      endDate: endDateStr,
      createdAt: new Date().toISOString(),
      description: `Archive of data from ${startDateStr} to ${endDateStr} (1 year)`,
    };

    await new Promise(async (resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);

      archive.pipe(output);

      // Add archive info file
      archive.append(JSON.stringify(archiveInfo, null, 2), { name: 'archive_info.json' });

      // Add CSV files with filtered data
      await appendYearlyCsvTables(dbConfig, archive, startDateStr, endDateStr);

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
      fileChecksum,
      integritySignature,
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
      checksum: fileChecksum,
      integritySignature,
      driveFileId: driveResponse?.id,
      driveViewLink: driveResponse?.webViewLink,
      driveDownloadLink: driveResponse?.webContentLink,
      downloadUrl,
      localPath: zipPath,
      triggerType,
      triggeredBy,
      year,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  } catch (err) {
    error = err;
    await saveBackupLog({
      fileName: zipFileName,
      fileSize: zipStats?.size || null,
      fileChecksum,
      integritySignature,
      driveFileId: driveResponse?.id,
      viewLink: driveResponse?.webViewLink,
      downloadLink: driveResponse?.webContentLink || downloadUrl,
      triggerType,
      triggeredBy,
      status: 'failed',
      errorMessage: err.message,
    }).catch((logError) => {
      console.error('Failed to log archive failure:', logError);
    });
    throw err;
  } finally {
    const retainLocal = process.env.RETAIN_LOCAL_DATABASE_BACKUPS === 'true';
    if (!retainLocal) {
      // Clean up is handled by the main backup function
    }
  }
}


export async function getBackupLogByFileName(fileName) {
  if (!fileName) {
    throw new Error('File name is required to look up a backup log');
  }

  await ensureBackupTable();
  const [rows] = await pool.execute(
    `SELECT id, file_name AS fileName, file_size AS fileSize,
      file_checksum AS fileChecksum,
      integrity_signature AS integritySignature,
      drive_file_id AS driveFileId,
      drive_view_link AS driveViewLink,
      drive_download_link AS driveDownloadLink,
      trigger_type AS triggerType,
      triggered_by AS triggeredBy,
      status,
      error_message AS errorMessage,
      created_at AS createdAt
    FROM backup_logs
    WHERE file_name = ?
    ORDER BY created_at DESC
    LIMIT 1`,
    [fileName]
  );
  return rows[0] || null;
}

export async function verifyBackupFileIntegrity({ fileName, expectedSignature, expectedChecksum } = {}) {
  if (!fileName || !expectedSignature) {
    throw new Error('fileName and expectedSignature are required to verify integrity');
  }

  const filePath = path.join(BACKUP_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }

  const computedChecksum = await computeFileChecksum(filePath);
  const computedSignature = buildIntegritySignature(fileName, computedChecksum);

  return {
    fileName,
    computedChecksum,
    computedSignature,
    checksumMatch: expectedChecksum ? expectedChecksum === computedChecksum : true,
    signatureMatch: expectedSignature === computedSignature,
    isValid: expectedSignature === computedSignature && (!expectedChecksum || expectedChecksum === computedChecksum),
  };
}


