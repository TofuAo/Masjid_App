# Encryption System Documentation

## Overview

This document describes the comprehensive encryption system implemented in MyMasjidApp to secure sensitive data at multiple layers of the application architecture.

## Table of Contents

1. [Security Features](#security-features)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Usage Guide](#usage-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Security Features

### 1. **Data-at-Rest Encryption**
- **AES-256-GCM** encryption for sensitive database fields
- Authenticated encryption with integrity checks
- Unique Initialization Vector (IV) for each encryption
- Automatic encryption/decryption middleware

### 2. **File Encryption**
- Encrypted storage for uploaded files (receipts, documents)
- Metadata tracking in database
- Transparent encryption/decryption
- Support for all file types

### 3. **API Request Signing**
- HMAC-SHA256 signatures for critical endpoints
- Replay attack prevention (timestamp + nonce)
- Webhook signature verification
- Audit log signing for tamper detection

### 4. **Transport Security**
- HTTPS/TLS enforced via HSTS headers
- Strict Content Security Policy (CSP)
- CORS with whitelist
- Rate limiting

### 5. **Authentication Security**
- BCrypt password hashing (already implemented)
- JWT tokens with expiration
- Session management
- Account lockout after failed attempts

---

## Architecture

### Encryption Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATION                   │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTPS/TLS
┌─────────────────────────────────────────────────────────┐
│                     API GATEWAY                         │
│  • Rate Limiting                                        │
│  • Request Signing (optional)                           │
│  • CORS Validation                                      │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                 ENCRYPTION MIDDLEWARE                   │
│  • Field-level encryption/decryption                    │
│  • Selective decryption based on roles                  │
│  • Data masking for unauthorized users                  │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LOGIC                      │
│  • Business rules                                       │
│  • Authorization checks                                 │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL)                       │
│  • Encrypted sensitive fields                           │
│  • Hashed passwords (BCrypt)                            │
│  • Encrypted files on disk                              │
└─────────────────────────────────────────────────────────┘
```

### Components

#### 1. **Encryption Utility** (`utils/encryption.js`)
Core encryption functions using Node.js crypto module:
- `encrypt(plaintext)` - Encrypts data
- `decrypt(encryptedData)` - Decrypts data
- `encryptFile(buffer)` - Encrypts file buffers
- `decryptFile(buffer, iv, authTag)` - Decrypts files
- `hashForIndex(data)` - Creates searchable hashes

#### 2. **Encryption Middleware** (`middleware/encryptionMiddleware.js`)
Automatic encryption/decryption for requests/responses:
- `encryptRequestFields(entityTypes)` - Encrypts incoming data
- `decryptResponseFields(entityTypes)` - Decrypts outgoing data
- `selectiveDecrypt(roles, entityTypes)` - Role-based decryption
- `maskResponseFields(entityTypes)` - Masks data for non-authorized users

#### 3. **File Encryption Service** (`utils/fileEncryption.js`)
File encryption management:
- `encryptAndSaveFile(buffer, path, metadata)` - Encrypts and stores file
- `readAndDecryptFile(path)` - Reads and decrypts file
- `migrateFilesToEncrypted(directory)` - Migrates existing files

#### 4. **API Signing Utility** (`utils/apiSigning.js`)
Request signature verification:
- `generateSignature(payload, timestamp, nonce)` - Creates signature
- `verifySignature(...)` - Validates signature
- `requireSignature` middleware - Enforces signatures
- `verifyWebhookSignature(...)` - Validates external webhooks

---

## Setup Instructions

### 1. Run Setup Script

```bash
node backend/scripts/setupEncryption.js
```

This script will:
- Create required database tables
- Generate encryption keys
- Add keys to `.env` file
- Display setup instructions

### 2. Verify Environment Variables

Check that your `.env` file contains:

```env
# Encryption Configuration
ENCRYPTION_KEY=<generated-key>

# API Request Signing
API_SIGNING_SECRET=<generated-secret>

# JWT Secret (existing)
JWT_SECRET=<your-jwt-secret>
```

**⚠️ IMPORTANT:**
- **Never commit `.env` to version control**
- **Back up these keys securely**
- **Use different keys for dev/staging/production**
- **Losing ENCRYPTION_KEY means losing encrypted data**

### 3. Create Database Tables

The setup script creates these tables:

**encrypted_files** - Stores file encryption metadata
```sql
CREATE TABLE encrypted_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL UNIQUE,
  encrypted_path VARCHAR(500) NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  user_ic VARCHAR(20),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**audit_log_signatures** - Stores audit log signatures
```sql
CREATE TABLE audit_log_signatures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_id INT NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  signature VARCHAR(255) NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Encrypt Existing Data (Optional)

If you have existing sensitive data to encrypt:

```bash
node backend/scripts/encryptExistingData.js
```

**⚠️ WARNING:** Always backup your database before running this script!

### 5. Restart Application

```bash
npm run start
```

---

## Usage Guide

### Encrypting Data in Controllers

#### Method 1: Using Middleware

```javascript
import { encryptRequestFields, decryptResponseFields } from '../middleware/encryptionMiddleware.js';

// Encrypt incoming data, decrypt outgoing data
router.post('/api/users', 
  authenticateToken,
  encryptRequestFields(['user']),  // Encrypts before saving
  createUser
);

router.get('/api/users/:id',
  authenticateToken,
  decryptResponseFields(['user']), // Decrypts before sending
  getUser
);
```

#### Method 2: Manual Encryption

```javascript
import { encrypt, decrypt } from '../utils/encryption.js';

// Encrypt before saving
const encryptedIC = encrypt(user.ic);
const encryptedPhone = encrypt(user.telefon);

await pool.execute(
  'INSERT INTO users (ic, telefon) VALUES (?, ?)',
  [encryptedIC, encryptedPhone]
);

// Decrypt after fetching
const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
const user = users[0];
user.ic = decrypt(user.ic);
user.telefon = decrypt(user.telefon);
```

#### Method 3: Selective Decryption (Role-Based)

```javascript
import { selectiveDecrypt } from '../middleware/encryptionMiddleware.js';

// Only admins see full data, others see masked data
router.get('/api/users',
  authenticateToken,
  selectiveDecrypt(['admin'], ['user']), // Only admins get decrypted data
  getAllUsers
);
```

### File Encryption

#### Encrypting Uploaded Files

```javascript
import { encryptAndSaveFile } from '../utils/fileEncryption.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const filePath = `/uploads/${Date.now()}-${file.originalname}`;
  
  // Encrypt and save
  const result = await encryptAndSaveFile(
    file.buffer,
    filePath,
    {
      originalName: file.originalname,
      mimeType: file.mimetype,
      userIc: req.user.ic
    }
  );
  
  res.json({ success: true, fileId: result.fileId });
});
```

#### Reading Encrypted Files

```javascript
import { readAndDecryptFile } from '../utils/fileEncryption.js';

router.get('/api/files/:fileId', async (req, res) => {
  // Get file path from database
  const [files] = await pool.execute(
    'SELECT file_path, mime_type FROM encrypted_files WHERE id = ?',
    [req.params.fileId]
  );
  
  const file = files[0];
  
  // Decrypt and send
  const decryptedBuffer = await readAndDecryptFile(file.file_path);
  
  res.contentType(file.mime_type);
  res.send(decryptedBuffer);
});
```

### API Request Signing

#### Protecting Critical Endpoints

```javascript
import { requireSignature } from '../utils/apiSigning.js';

// Require signature for critical operations
router.post('/api/admin/delete-user',
  authenticateToken,
  requireRole(['admin']),
  requireSignature,  // ← Requires valid signature
  deleteUser
);
```

#### Client-Side: Signing Requests

```javascript
import crypto from 'crypto';

// Generate signature headers
function generateSignatureHeaders(payload) {
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const message = JSON.stringify(payload) + timestamp + nonce;
  const signature = crypto
    .createHmac('sha256', API_SIGNING_SECRET)
    .update(message)
    .digest('hex');
  
  return {
    'x-signature': signature,
    'x-timestamp': timestamp,
    'x-nonce': nonce
  };
}

// Make signed request
const payload = { userId: 123 };
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  ...generateSignatureHeaders(payload)
};

fetch('/api/admin/delete-user', {
  method: 'POST',
  headers,
  body: JSON.stringify(payload)
});
```

#### Verifying Webhooks

```javascript
import { verifyWebhookSignature } from '../utils/apiSigning.js';

router.post('/api/webhook/payment', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  const isValid = verifyWebhookSignature(
    payload,
    signature,
    WEBHOOK_SECRET,
    'sha256'
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
});
```

---

## Best Practices

### 1. **Key Management**

✅ **DO:**
- Use strong, randomly generated keys
- Store keys in environment variables (`.env`)
- Use different keys for each environment
- Rotate keys periodically
- Back up keys in secure location (password manager, HSM)

❌ **DON'T:**
- Hardcode keys in source code
- Commit keys to version control
- Share keys via email/Slack
- Use same key for multiple purposes
- Store keys in database

### 2. **What to Encrypt**

**Always Encrypt:**
- IC numbers (NRIC/passport)
- Phone numbers
- Physical addresses
- Email addresses (optional)
- Payment references
- Medical/health information
- Guardian/parent information

**Hash Instead of Encrypt:**
- Passwords (use BCrypt - already implemented)
- Security questions/answers

**Never Encrypt:**
- Primary keys / IDs
- Foreign keys
- Timestamps
- Non-sensitive metadata
- Search/filter fields (unless using searchable encryption)

### 3. **Performance Considerations**

- Encrypt at application layer, not database triggers
- Use connection pooling
- Cache decrypted data (with caution)
- Index on hashed values for searching
- Batch encrypt/decrypt operations

### 4. **Compliance**

This encryption system helps meet:
- **PDPA (Personal Data Protection Act)** - Malaysia
- **GDPR** principles - if handling EU data
- **PCI DSS** - if storing payment data
- General data protection best practices

### 5. **Logging and Monitoring**

✅ **DO:**
- Log encryption/decryption failures
- Monitor for unusual patterns
- Sign audit logs to prevent tampering

❌ **DON'T:**
- Log decrypted sensitive data
- Log encryption keys
- Include PII in error messages

---

## Troubleshooting

### Problem: "ENCRYPTION_KEY not set" Warning

**Solution:**
```bash
node backend/scripts/setupEncryption.js
```

Or manually add to `.env`:
```env
ENCRYPTION_KEY=<generate-32-byte-key-in-base64>
```

### Problem: "Failed to decrypt data" Error

**Causes:**
1. Wrong encryption key
2. Data corrupted
3. Data not actually encrypted

**Solutions:**
1. Verify `ENCRYPTION_KEY` matches the key used to encrypt
2. Check data format: should be `iv:authTag:encryptedData`
3. Use `isEncrypted(data)` to check if data is encrypted

### Problem: Performance Degradation

**Solutions:**
1. Encrypt only truly sensitive fields
2. Use database indexes on non-encrypted searchable fields
3. Implement caching for frequently accessed data
4. Consider selective encryption (encrypt only for certain users)

### Problem: Cannot Search Encrypted Fields

**Solutions:**
1. Use `hashForIndex()` to create searchable hashes
2. Store hash alongside encrypted data
3. Search using hash comparison

Example:
```javascript
import { encrypt, hashForIndex } from '../utils/encryption.js';

const ic = '123456-78-9012';
const encryptedIC = encrypt(ic);
const icHash = hashForIndex(ic);

// Store both
await pool.execute(
  'INSERT INTO users (ic, ic_hash) VALUES (?, ?)',
  [encryptedIC, icHash]
);

// Search using hash
const searchIC = '123456-78-9012';
const searchHash = hashForIndex(searchIC);

const [users] = await pool.execute(
  'SELECT * FROM users WHERE ic_hash = ?',
  [searchHash]
);
```

### Problem: Key Rotation Needed

**Solution:**
Use the key rotation function:

```javascript
import { rotateKey } from '../utils/encryption.js';

const oldKey = process.env.OLD_ENCRYPTION_KEY;
const newKey = process.env.NEW_ENCRYPTION_KEY;

// Rotate for single field
const reencrypted = rotateKey(encryptedData, oldKey, newKey);
```

For bulk rotation, create a script:
```javascript
// Update all records
const [users] = await pool.execute('SELECT * FROM users');

for (const user of users) {
  const newIC = rotateKey(user.ic, OLD_KEY, NEW_KEY);
  const newPhone = rotateKey(user.telefon, OLD_KEY, NEW_KEY);
  
  await pool.execute(
    'UPDATE users SET ic = ?, telefon = ? WHERE id = ?',
    [newIC, newPhone, user.id]
  );
}
```

---

## Security Checklist

Before deploying to production:

- [ ] ENCRYPTION_KEY is set and backed up securely
- [ ] Different keys for dev/staging/production
- [ ] `.env` file is in `.gitignore`
- [ ] Database backups are encrypted
- [ ] HTTPS/TLS is enabled
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled
- [ ] Error messages don't leak sensitive data
- [ ] API signatures for critical endpoints
- [ ] File uploads are validated and encrypted
- [ ] Access controls tested
- [ ] Encryption performance tested under load

---

## Support and Maintenance

### Regular Tasks

**Weekly:**
- Review encryption failure logs
- Monitor performance metrics

**Monthly:**
- Audit access logs
- Review encrypted data inventory
- Test backup/restore procedures

**Annually:**
- Rotate encryption keys
- Security audit
- Update encryption libraries
- Review compliance requirements

### Emergency Procedures

**If Encryption Key is Compromised:**
1. Immediately rotate to new key
2. Re-encrypt all data
3. Audit access logs
4. Notify affected parties if required

**If Key is Lost:**
- Encrypted data is **permanently lost**
- Restore from backup if available
- This is why backups are critical!

---

## Additional Resources

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Encryption Guidelines](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

---

**Last Updated:** December 2025
**Version:** 1.0.0
