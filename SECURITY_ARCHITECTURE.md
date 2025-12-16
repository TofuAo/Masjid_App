# MyMasjidApp - Enhanced Security Architecture

## Overview

This document outlines the comprehensive security measures implemented in MyMasjidApp to protect sensitive data and prevent security threats.

---

## Security Layers

### Layer 1: Transport Security (HTTPS/TLS)

**Implementation:** `backend/server.js`

```javascript
// HSTS Headers
hsts: {
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
  force: true
}
```

**Protection Against:**
- Man-in-the-middle attacks
- Data interception
- Session hijacking

---

### Layer 2: Application Security

#### 2.1 Security Headers (Helmet.js)

**Implementation:** `backend/server.js`

```javascript
app.use(helmet({
  contentSecurityPolicy: { ... },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

**Protection Against:**
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Referrer leakage

#### 2.2 CORS Protection

**Implementation:** `backend/server.js`

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const isAllowed = allowedOrigins.includes(origin);
    callback(isAllowed ? null : new Error('Not allowed'), isAllowed);
  },
  credentials: true
};
```

**Protection Against:**
- Cross-origin attacks
- Unauthorized API access

#### 2.3 Rate Limiting

**Implementation:** `backend/server.js`

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // requests per window
});
```

**Protection Against:**
- Brute force attacks
- DoS attacks
- API abuse

#### 2.4 Input Sanitization

**Implementation:** `backend/middleware/sanitize.js`

**Protection Against:**
- SQL injection
- XSS attacks
- Command injection
- Path traversal

---

### Layer 3: Authentication & Authorization

#### 3.1 Password Security

**Implementation:** `backend/controllers/authController.js`

```javascript
// BCrypt hashing with salt rounds
const hashedPassword = await bcrypt.hash(password, 10);
```

**Features:**
- BCrypt with 10 salt rounds
- Password strength validation
- Password history (prevents reuse)

#### 3.2 JWT Tokens

**Implementation:** `backend/middleware/auth.js`

```javascript
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Features:**
- Short-lived access tokens (24 hours)
- Refresh tokens (7 days)
- Role-based access control (RBAC)
- Token invalidation

#### 3.3 Account Lockout

**Implementation:** `backend/services/accountLockoutService.js`

**Features:**
- Lock account after 5 failed attempts
- 30-minute lockout period
- Automatic unlock
- Failed attempt logging

---

### Layer 4: Data Encryption ⭐ NEW

#### 4.1 Data-at-Rest Encryption

**Implementation:** `backend/utils/encryption.js`

**Algorithm:** AES-256-GCM

**Features:**
- Authenticated encryption with integrity checks
- Unique IV for each encryption
- Authentication tags
- Key rotation support

**Encrypted Fields:**
```javascript
const SENSITIVE_FIELDS = {
  user: ['ic', 'telefon', 'alamat'],
  student: ['ic', 'telefon', 'alamat', 'nama_wali', 'telefon_wali'],
  teacher: ['ic', 'telefon', 'alamat'],
  payment: ['provider_reference', 'proof_url']
};
```

#### 4.2 File Encryption

**Implementation:** `backend/utils/fileEncryption.js`

**Features:**
- Encrypted file storage
- Metadata tracking in database
- Transparent decryption
- Support for all file types

**Process:**
```
File Upload → Encrypt → Store Encrypted → Store Metadata
File Access → Fetch Metadata → Decrypt → Serve File
```

#### 4.3 API Request Signing

**Implementation:** `backend/utils/apiSigning.js`

**Algorithm:** HMAC-SHA256

**Features:**
- Request integrity verification
- Replay attack prevention (nonce + timestamp)
- Webhook signature verification
- Audit log signing

**Signature Format:**
```
signature = HMAC-SHA256(payload + timestamp + nonce, secret)
```

#### 4.4 Selective Encryption/Decryption

**Implementation:** `backend/middleware/encryptionMiddleware.js`

**Features:**
- Role-based decryption (admins see full data)
- Data masking for unauthorized users
- Field-level encryption control
- Automatic encryption/decryption

**Example:**
```javascript
// Admin sees: "123456-78-9012"
// Student sees: "12********9012"
// Public sees: "************"
```

---

### Layer 5: Database Security

#### 5.1 Connection Security

**Implementation:** `backend/config/database.js`

**Features:**
- Connection pooling (limit: 10)
- Timeout protection
- SSL/TLS for production (recommended)

#### 5.2 Prepared Statements

**All queries use parameterized statements:**

```javascript
// ✅ SAFE - Uses prepared statement
await pool.execute(
  'SELECT * FROM users WHERE ic = ?',
  [userIc]
);

// ❌ UNSAFE - SQL injection risk
await pool.execute(
  `SELECT * FROM users WHERE ic = '${userIc}'`
);
```

#### 5.3 Encrypted Fields Table

**New table:** `encrypted_files`

```sql
CREATE TABLE encrypted_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_path VARCHAR(500) UNIQUE,
  encrypted_path VARCHAR(500),
  iv VARCHAR(255),
  auth_tag VARCHAR(255),
  metadata JSON,
  created_at TIMESTAMP
);
```

---

### Layer 6: Audit & Monitoring

#### 6.1 Security Logging

**Implementation:** `backend/middleware/securityLogger.js`

**Logged Events:**
- Failed authentication attempts
- Unauthorized access attempts
- Suspicious activities
- Admin actions
- Encryption/decryption failures

#### 6.2 Signed Audit Logs

**Implementation:** `backend/utils/apiSigning.js`

**Features:**
- Tamper-proof audit logs
- Cryptographic signatures
- Verification of log integrity

**New table:** `audit_log_signatures`

```sql
CREATE TABLE audit_log_signatures (
  id INT PRIMARY KEY,
  log_id INT,
  log_type VARCHAR(50),
  signature VARCHAR(255),
  signed_at TIMESTAMP
);
```

---

## Security Best Practices Implemented

### ✅ Confidentiality
- [x] HTTPS/TLS encryption in transit
- [x] AES-256-GCM encryption at rest
- [x] Encrypted file storage
- [x] Sensitive field encryption
- [x] Secure key management

### ✅ Integrity
- [x] HMAC signatures for API requests
- [x] Authentication tags in encryption
- [x] Signed audit logs
- [x] Webhook signature verification
- [x] Input validation and sanitization

### ✅ Availability
- [x] Rate limiting (prevent DoS)
- [x] Connection pooling
- [x] Timeout protection
- [x] Account lockout (prevent brute force)
- [x] Error handling

### ✅ Authentication
- [x] BCrypt password hashing
- [x] JWT token authentication
- [x] Refresh token support
- [x] Session management
- [x] Multi-factor authentication ready

### ✅ Authorization
- [x] Role-based access control (RBAC)
- [x] Multi-role support
- [x] Selective data access
- [x] Permission checks on all endpoints
- [x] Admin action logging

### ✅ Accountability
- [x] Comprehensive audit logging
- [x] Failed attempt tracking
- [x] Admin action logging
- [x] Signed logs (tamper-proof)
- [x] User activity monitoring

---

## Compliance

This security architecture helps meet:

### PDPA (Personal Data Protection Act) - Malaysia
- ✅ Data encryption at rest and in transit
- ✅ Access control and authentication
- ✅ Audit logging
- ✅ Data retention policies
- ✅ Breach notification capability

### GDPR Principles
- ✅ Data minimization
- ✅ Storage limitation
- ✅ Integrity and confidentiality
- ✅ Accountability
- ✅ Right to be forgotten (delete functionality)

### PCI DSS (if handling payment data)
- ✅ Encrypt cardholder data
- ✅ Protect stored cardholder data
- ✅ Maintain access logs
- ✅ Restrict access by business need-to-know
- ✅ Track and monitor access

---

## Security Testing Checklist

### Before Deployment:

- [ ] All `.env` files excluded from git
- [ ] Encryption keys generated and backed up
- [ ] Different keys for dev/staging/production
- [ ] HTTPS/TLS enabled on production
- [ ] Rate limiting configured appropriately
- [ ] CORS whitelist configured
- [ ] All endpoints have authentication
- [ ] Role checks on admin endpoints
- [ ] Input validation on all forms
- [ ] Error messages don't leak sensitive data
- [ ] Database backups encrypted
- [ ] Audit logging enabled
- [ ] Security headers verified (Helmet)
- [ ] File upload validation and encryption
- [ ] API signatures for critical operations
- [ ] Password policy enforced

### Regular Testing:

**Weekly:**
- [ ] Review failed authentication logs
- [ ] Check for suspicious activities
- [ ] Monitor rate limit violations

**Monthly:**
- [ ] Security audit of new features
- [ ] Review access logs
- [ ] Test backup/restore procedures
- [ ] Update dependencies (security patches)

**Quarterly:**
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Key rotation
- [ ] Security training for team

**Annually:**
- [ ] Full security audit
- [ ] Compliance review
- [ ] Disaster recovery test
- [ ] Third-party security assessment

---

## Threat Model

### Threats Mitigated:

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| Data breach | Encryption at rest | Data Layer |
| Man-in-the-middle | HTTPS/TLS | Transport Layer |
| SQL injection | Prepared statements | Application Layer |
| XSS attacks | Input sanitization, CSP | Application Layer |
| CSRF attacks | Token validation | Application Layer |
| Brute force | Rate limiting, account lockout | Authentication Layer |
| Session hijacking | Secure cookies, HTTPS | Authentication Layer |
| Privilege escalation | RBAC, role checks | Authorization Layer |
| Data tampering | HMAC signatures | Integrity Layer |
| Replay attacks | Nonce + timestamp | API Layer |
| File upload attacks | Validation, encryption | Application Layer |
| DoS attacks | Rate limiting | Network Layer |

---

## Key Management

### Encryption Keys

**Location:** `.env` file (never committed)

**Keys:**
- `ENCRYPTION_KEY` - Data encryption (AES-256)
- `API_SIGNING_SECRET` - Request signing (HMAC)
- `JWT_SECRET` - Token signing (already existed)

**Backup Strategy:**
1. Store in secure password manager (e.g., 1Password, LastPass)
2. Encrypt backup file with GPG
3. Store in secure, separate location
4. Multiple backup copies (3-2-1 rule)

**Rotation Schedule:**
- `ENCRYPTION_KEY` - Every 6-12 months
- `API_SIGNING_SECRET` - Every 6 months
- `JWT_SECRET` - Every 3-6 months

---

## Incident Response

### If Encryption Key is Compromised:

1. **Immediate Actions:**
   - [ ] Generate new encryption key
   - [ ] Stop affected services
   - [ ] Assess scope of compromise

2. **Short-term Actions (24 hours):**
   - [ ] Re-encrypt all data with new key
   - [ ] Rotate all related secrets
   - [ ] Review access logs
   - [ ] Notify security team

3. **Long-term Actions (1 week):**
   - [ ] Root cause analysis
   - [ ] Update security procedures
   - [ ] Compliance notification (if required)
   - [ ] Staff training

### If Data Breach Detected:

1. **Contain:**
   - Stop the breach
   - Secure systems
   - Preserve evidence

2. **Assess:**
   - Determine what data was accessed
   - Identify affected users
   - Assess legal obligations

3. **Notify:**
   - Internal stakeholders
   - Affected users
   - Regulatory bodies (if required)

4. **Remediate:**
   - Fix vulnerabilities
   - Improve security measures
   - Monitor for further issues

---

## Security Contacts

**Security Issues:** Report to system administrator immediately

**Emergency:** Follow incident response procedures

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial security architecture |
| 1.1.0 | Dec 2025 | Added comprehensive encryption system |

---

**Last Updated:** December 15, 2025
