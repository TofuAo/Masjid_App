# Encryption System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you quickly set up and start using the encryption system in MyMasjidApp.

---

## Step 1: Run Setup (2 minutes)

```bash
cd backend
npm run setup-encryption
```

This will:
- ✅ Create necessary database tables
- ✅ Generate encryption keys
- ✅ Add keys to `.env` file

**⚠️ Important:** Back up the generated keys from your `.env` file!

---

## Step 2: Restart Application (1 minute)

```bash
# Stop the application if running
# Then start it again
npm run start

# Or for development
npm run dev
```

---

## Step 3: Test Encryption (2 minutes)

### Test 1: Check if encryption is working

Create a test file: `backend/test-encryption.js`

```javascript
import { encrypt, decrypt } from './utils/encryption.js';

// Test basic encryption
const sensitive = "123456-78-9012";
console.log('Original:', sensitive);

const encrypted = encrypt(sensitive);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);

console.log('Match:', sensitive === decrypted ? '✅ PASS' : '❌ FAIL');
```

Run it:
```bash
node backend/test-encryption.js
```

### Test 2: API Endpoint Test

The encryption is now active on all API endpoints. Try creating a user and check the database - sensitive fields will be encrypted!

---

## What's Now Encrypted?

### Automatically Encrypted Fields:

**Users Table:**
- IC numbers
- Phone numbers  
- Addresses

**Students Table:**
- IC numbers
- Phone numbers
- Addresses
- Guardian information

**Files:**
- All uploaded files (receipts, documents)

---

## Usage Examples

### 1. Encrypt Data Before Saving

```javascript
import { encrypt } from '../utils/encryption.js';

// Manual encryption
const encryptedIC = encrypt(userIC);
await pool.execute('INSERT INTO users (ic) VALUES (?)', [encryptedIC]);
```

### 2. Decrypt Data After Reading

```javascript
import { decrypt } from '../utils/encryption.js';

// Manual decryption
const [users] = await pool.execute('SELECT ic FROM users WHERE id = ?', [id]);
const decryptedIC = decrypt(users[0].ic);
```

### 3. Use Middleware (Recommended)

```javascript
import { encryptRequestFields, decryptResponseFields } from '../middleware/encryptionMiddleware.js';

// Automatically encrypts incoming data
router.post('/api/users', encryptRequestFields(['user']), createUser);

// Automatically decrypts outgoing data
router.get('/api/users/:id', decryptResponseFields(['user']), getUser);
```

---

## Optional: Encrypt Existing Data

If you have existing data in the database:

```bash
npm run encrypt-existing-data
```

**⚠️ WARNING:** 
- Backup your database first!
- Test on development environment first!
- Run during low-traffic periods

---

## Security Checklist

After setup, verify:

- [ ] `.env` file contains `ENCRYPTION_KEY`
- [ ] `.env` file is NOT committed to git (check `.gitignore`)
- [ ] Encryption key is backed up securely
- [ ] Application starts without errors
- [ ] Test encryption/decryption works
- [ ] Different keys for dev/production

---

## Common Issues

### Issue: "ENCRYPTION_KEY not set" error

**Fix:**
```bash
npm run setup-encryption
```

### Issue: "Failed to decrypt" error

**Cause:** Wrong encryption key or corrupted data

**Fix:** 
1. Verify `ENCRYPTION_KEY` in `.env` matches the key used to encrypt
2. Check if data is actually encrypted (should contain colons: `iv:tag:data`)

### Issue: Can't search encrypted fields

**Solution:** Use hashed indexes

```javascript
import { hashForIndex } from '../utils/encryption.js';

// Store hash for searching
const icHash = hashForIndex(userIC);
await pool.execute(
  'INSERT INTO users (ic, ic_hash) VALUES (?, ?)',
  [encrypt(userIC), icHash]
);

// Search using hash
const searchHash = hashForIndex(searchIC);
const [users] = await pool.execute(
  'SELECT * FROM users WHERE ic_hash = ?',
  [searchHash]
);
```

---

## Need More Help?

📖 **Full Documentation:** See `ENCRYPTION_DOCUMENTATION.md` for detailed usage, best practices, and advanced features.

🔧 **Troubleshooting:** Check the troubleshooting section in the full documentation.

🔐 **Security:** Review security best practices and compliance guidelines.

---

## Next Steps

1. ✅ Review `ENCRYPTION_DOCUMENTATION.md` for full details
2. ✅ Configure role-based decryption for admin panels
3. ✅ Set up API request signing for critical endpoints
4. ✅ Test file encryption for uploads
5. ✅ Schedule regular key rotation
6. ✅ Configure backup encryption

---

**🎉 You're all set!** Your application now has enterprise-grade encryption for sensitive data.

**Remember:** Keep your encryption keys safe - losing them means losing your encrypted data!
