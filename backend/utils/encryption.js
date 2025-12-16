import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Encryption Utility Service
 * Provides AES-256-GCM encryption for sensitive data
 * 
 * Features:
 * - Strong encryption using AES-256-GCM (Galois/Counter Mode)
 * - Authentication tag for data integrity
 * - Initialization Vector (IV) for each encryption
 * - Base64 encoding for storage
 * 
 * Security Notes:
 * - ENCRYPTION_KEY must be 32 bytes (256 bits)
 * - Each encryption uses a unique IV
 * - Authentication tag ensures data hasn't been tampered with
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * If not set, generate a secure key (for development only)
 */
function getEncryptionKey() {
  let key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('⚠️  ENCRYPTION_KEY not set in environment variables. Generating temporary key.');
    console.warn('⚠️  Please set ENCRYPTION_KEY in your .env file for production!');
    // Generate a temporary key (DO NOT use in production)
    key = crypto.randomBytes(KEY_LENGTH).toString('base64');
  }
  
  // Convert key to buffer (handle both hex and base64)
  let keyBuffer;
  try {
    // Try to parse as base64 first
    keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== KEY_LENGTH) {
      // If not 32 bytes, try hex
      keyBuffer = Buffer.from(key, 'hex');
    }
  } catch (e) {
    // Fallback: hash the key to ensure 32 bytes
    keyBuffer = crypto.createHash('sha256').update(key).digest();
  }
  
  // Ensure key is exactly 32 bytes
  if (keyBuffer.length !== KEY_LENGTH) {
    keyBuffer = crypto.createHash('sha256').update(keyBuffer).digest();
  }
  
  return keyBuffer;
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:encryptedData (base64)
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  
  try {
    // Convert to string if not already
    const data = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
    
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns {string} Decrypted data
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    
    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object's sensitive fields
 * 
 * @param {Object} obj - Object with sensitive fields
 * @param {Array<string>} fields - Fields to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptObject(obj, fields) {
  if (!obj || !fields || fields.length === 0) return obj;
  
  const encrypted = { ...obj };
  
  for (const field of fields) {
    if (encrypted[field] && encrypted[field] !== null) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an object's encrypted fields
 * 
 * @param {Object} obj - Object with encrypted fields
 * @param {Array<string>} fields - Fields to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptObject(obj, fields) {
  if (!obj || !fields || fields.length === 0) return obj;
  
  const decrypted = { ...obj };
  
  for (const field of fields) {
    if (decrypted[field] && decrypted[field] !== null) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return decrypted;
}

/**
 * Hash sensitive data for indexing/searching
 * Use this for searchable fields that need to be encrypted
 * 
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash (hex)
 */
export function hashForIndex(data) {
  if (!data) return null;
  
  // Use HMAC for additional security
  const hmac = crypto.createHmac('sha256', getEncryptionKey());
  hmac.update(String(data));
  return hmac.digest('hex');
}

/**
 * Encrypt a file buffer
 * 
 * @param {Buffer} fileBuffer - File data to encrypt
 * @returns {Object} { encrypted: Buffer, iv: string, authTag: string }
 */
export function encryptFile(fileBuffer) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer');
  }
  
  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt file
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file buffer
 * 
 * @param {Buffer} encryptedBuffer - Encrypted file data
 * @param {string} ivBase64 - IV in base64
 * @param {string} authTagBase64 - Auth tag in base64
 * @returns {Buffer} Decrypted file buffer
 */
export function decryptFile(encryptedBuffer, ivBase64, authTagBase64) {
  if (!encryptedBuffer || !Buffer.isBuffer(encryptedBuffer)) {
    throw new Error('Invalid encrypted buffer');
  }
  
  try {
    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt file
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Generate a random encryption key (for setup)
 * 
 * @returns {string} Base64-encoded encryption key
 */
export function generateEncryptionKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Verify if data is encrypted (basic check)
 * 
 * @param {string} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export function isEncrypted(data) {
  if (!data || typeof data !== 'string') return false;
  
  // Check if data matches our encryption format: iv:authTag:encryptedData
  const parts = data.split(':');
  return parts.length === 3;
}

/**
 * Rotate encryption key (re-encrypt data with new key)
 * Use this when rotating encryption keys
 * 
 * @param {string} encryptedData - Data encrypted with old key
 * @param {string} oldKey - Old encryption key (base64)
 * @param {string} newKey - New encryption key (base64)
 * @returns {string} Data re-encrypted with new key
 */
export function rotateKey(encryptedData, oldKey, newKey) {
  // Temporarily set old key
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = oldKey;
  
  // Decrypt with old key
  const decrypted = decrypt(encryptedData);
  
  // Set new key
  process.env.ENCRYPTION_KEY = newKey;
  
  // Encrypt with new key
  const reencrypted = encrypt(decrypted);
  
  // Restore original key
  process.env.ENCRYPTION_KEY = originalKey;
  
  return reencrypted;
}

export default {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashForIndex,
  encryptFile,
  decryptFile,
  generateEncryptionKey,
  isEncrypted,
  rotateKey
};
