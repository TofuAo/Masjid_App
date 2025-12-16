import fs from 'fs/promises';
import path from 'path';
import { encryptFile, decryptFile } from './encryption.js';
import { pool } from '../config/database.js';

/**
 * File Encryption Service
 * Encrypts uploaded files for security
 * 
 * Features:
 * - Encrypts files at rest
 * - Stores encryption metadata in database
 * - Transparent decryption when accessing files
 * - Supports all file types
 */

/**
 * Encrypt and save a file
 * 
 * @param {Buffer} fileBuffer - File data to encrypt
 * @param {string} filePath - Where to save the encrypted file
 * @param {Object} metadata - File metadata (user_id, type, etc.)
 * @returns {Object} { encryptedPath, iv, authTag, fileId }
 */
export async function encryptAndSaveFile(fileBuffer, filePath, metadata = {}) {
  try {
    // Encrypt the file
    const { encrypted, iv, authTag } = encryptFile(fileBuffer);
    
    // Ensure directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Save encrypted file
    const encryptedPath = `${filePath}.encrypted`;
    await fs.writeFile(encryptedPath, encrypted);
    
    // Store encryption metadata in database
    const [result] = await pool.execute(
      `INSERT INTO encrypted_files 
       (file_path, encrypted_path, iv, auth_tag, original_name, mime_type, user_ic, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        filePath,
        encryptedPath,
        iv,
        authTag,
        metadata.originalName || path.basename(filePath),
        metadata.mimeType || 'application/octet-stream',
        metadata.userIc || null,
        JSON.stringify(metadata)
      ]
    );
    
    return {
      encryptedPath,
      iv,
      authTag,
      fileId: result.insertId
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt and save file');
  }
}

/**
 * Read and decrypt a file
 * 
 * @param {string} filePath - Path to original file (not encrypted path)
 * @returns {Buffer} Decrypted file buffer
 */
export async function readAndDecryptFile(filePath) {
  try {
    // Get encryption metadata from database
    const [files] = await pool.execute(
      'SELECT encrypted_path, iv, auth_tag FROM encrypted_files WHERE file_path = ? LIMIT 1',
      [filePath]
    );
    
    if (files.length === 0) {
      throw new Error('File encryption metadata not found');
    }
    
    const { encrypted_path, iv, auth_tag } = files[0];
    
    // Read encrypted file
    const encryptedBuffer = await fs.readFile(encrypted_path);
    
    // Decrypt file
    const decrypted = decryptFile(encryptedBuffer, iv, auth_tag);
    
    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to read and decrypt file');
  }
}

/**
 * Delete encrypted file and metadata
 * 
 * @param {string} filePath - Path to original file
 */
export async function deleteEncryptedFile(filePath) {
  try {
    // Get encrypted file path from database
    const [files] = await pool.execute(
      'SELECT encrypted_path FROM encrypted_files WHERE file_path = ? LIMIT 1',
      [filePath]
    );
    
    if (files.length > 0) {
      const { encrypted_path } = files[0];
      
      // Delete encrypted file
      try {
        await fs.unlink(encrypted_path);
      } catch (err) {
        console.error('Error deleting encrypted file:', err);
      }
      
      // Delete metadata
      await pool.execute(
        'DELETE FROM encrypted_files WHERE file_path = ?',
        [filePath]
      );
    }
  } catch (error) {
    console.error('Error deleting encrypted file:', error);
    throw error;
  }
}

/**
 * Migrate existing unencrypted files to encrypted storage
 * Use this for existing files in the system
 * 
 * @param {string} directoryPath - Directory containing files to encrypt
 */
export async function migrateFilesToEncrypted(directoryPath) {
  try {
    console.log(`🔐 Starting file encryption migration for: ${directoryPath}`);
    
    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    let encrypted = 0;
    let failed = 0;
    
    for (const file of files) {
      if (!file.isFile()) continue;
      
      const filePath = path.join(directoryPath, file.name);
      
      // Skip already encrypted files
      if (filePath.endsWith('.encrypted')) continue;
      
      // Check if file is already encrypted in database
      const [existing] = await pool.execute(
        'SELECT id FROM encrypted_files WHERE file_path = ?',
        [filePath]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping already encrypted file: ${file.name}`);
        continue;
      }
      
      try {
        // Read original file
        const fileBuffer = await fs.readFile(filePath);
        
        // Encrypt and save
        await encryptAndSaveFile(fileBuffer, filePath, {
          originalName: file.name,
          migratedAt: new Date().toISOString()
        });
        
        // Delete original unencrypted file
        await fs.unlink(filePath);
        
        encrypted++;
        console.log(`✅ Encrypted: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to encrypt ${file.name}:`, error);
        failed++;
      }
    }
    
    console.log(`\n📊 Migration complete:`);
    console.log(`   ✅ Encrypted: ${encrypted} files`);
    console.log(`   ❌ Failed: ${failed} files`);
    
    return { encrypted, failed };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Check if a file is encrypted
 * 
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is encrypted
 */
export async function isFileEncrypted(filePath) {
  try {
    const [files] = await pool.execute(
      'SELECT id FROM encrypted_files WHERE file_path = ? LIMIT 1',
      [filePath]
    );
    return files.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get file encryption metadata
 * 
 * @param {string} filePath - File path
 * @returns {Object|null} File metadata
 */
export async function getFileMetadata(filePath) {
  try {
    const [files] = await pool.execute(
      'SELECT * FROM encrypted_files WHERE file_path = ? LIMIT 1',
      [filePath]
    );
    
    if (files.length === 0) return null;
    
    const file = files[0];
    return {
      ...file,
      metadata: file.metadata ? JSON.parse(file.metadata) : {}
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

export default {
  encryptAndSaveFile,
  readAndDecryptFile,
  deleteEncryptedFile,
  migrateFilesToEncrypted,
  isFileEncrypted,
  getFileMetadata
};
