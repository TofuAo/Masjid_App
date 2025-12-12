# Security Enhancements Documentation

## Overview

This document outlines comprehensive security enhancements implemented to strengthen the MyMasjidApp system against various attack vectors and security threats.

## Implemented Security Features

### 1. Account Lockout System

**Service:** `backend/services/accountLockoutService.js`

**Features:**
- Automatic account lockout after 5 failed login attempts
- 15-minute lockout duration
- Tracks login attempts per user and IP address
- Automatically unlocks after lockout period expires
- Clears failed attempts on successful login

**Database Tables:**
- `login_attempts` - Stores failed login attempts
- `users.account_locked_until` - Tracks account lockout expiration

**Usage:**
```javascript
// Check if account is locked
const lockStatus = await isAccountLocked(ic);

// Record failed attempt
await recordFailedAttempt(ic, ip);

// Record successful login
await recordSuccessfulLogin(ic);
```

### 2. Enhanced Password Policy

**Service:** `backend/utils/passwordPolicy.js`

**Requirements:**
- Minimum 8 characters (was 6)
- Maximum 128 characters
- Checks for common weak passwords
- Detects repetitive characters
- Detects sequential patterns (e.g., "123", "abc")
- Strength rating: weak, fair, good, strong

**Validation:**
- Password strength calculation based on:
  - Length
  - Character variety (lowercase, uppercase, numbers, special)
  - Pattern detection
  - Common password checks

### 3. JWT Token Security Improvements

**Changes:**
- **Short-lived Access Tokens:** 15 minutes (was 24 hours)
- **Refresh Tokens:** 7 days for token renewal
- **Token Types:** Separate access and refresh tokens
- **Token Storage:** Refresh tokens stored in database for revocation

**Database Table:**
- `refresh_tokens` - Stores refresh tokens for management

**Benefits:**
- Reduced attack window if token is compromised
- Ability to revoke refresh tokens
- Better session management

### 4. Enhanced Security Headers

**Middleware:** Helmet.js with enhanced configuration

**Headers Added:**
- **Content Security Policy (CSP)** - Prevents XSS attacks
- **Strict Transport Security (HSTS)** - Forces HTTPS
- **X-Content-Type-Options** - Prevents MIME type sniffing
- **X-Frame-Options** - Prevents clickjacking
- **X-XSS-Protection** - Browser XSS filter
- **Referrer Policy** - Controls referrer information
- **Permissions Policy** - Restricts browser features

**Configuration:**
```javascript
helmet({
  contentSecurityPolicy: { /* ... */ },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // ... additional security headers
})
```

### 5. Improved Authentication Flow

**Enhancements:**
- Account lockout check before password validation
- Failed attempt tracking and recording
- Clear error messages with remaining attempts
- Automatic unlock after successful login
- Comprehensive security logging

**Error Messages:**
- Clear indication of remaining attempts
- Lockout duration information
- Account status details

### 6. Input Sanitization

**Middleware:** `backend/middleware/sanitize.js`

**Features:**
- Removes script tags
- Removes iframe tags
- Removes JavaScript: protocol
- Removes event handlers (onclick, etc.)
- Recursive sanitization of objects and arrays

### 7. Rate Limiting

**Existing Implementation Enhanced:**
- Authentication endpoints: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- Password reset: 10 attempts per hour (production)
- General API: 1000 requests per 15 minutes

### 8. Security Logging

**Service:** `backend/middleware/securityLogger.js`

**Events Logged:**
- Failed authentication attempts
- Suspicious activities
- Unauthorized access attempts
- Rate limit exceeded
- Account lockouts
- Password migration events

## Security Best Practices Implemented

### Password Security
1. ✅ Bcrypt hashing with 12 rounds
2. ✅ Password strength validation
3. ✅ Common password detection
4. ✅ Automatic migration of plaintext passwords
5. ✅ Password length limits

### Authentication Security
1. ✅ Account lockout after failed attempts
2. ✅ Short-lived access tokens
3. ✅ Refresh token system
4. ✅ IP-based tracking
5. ✅ Comprehensive logging

### API Security
1. ✅ Rate limiting on all endpoints
2. ✅ Input sanitization
3. ✅ Security headers
4. ✅ CORS configuration
5. ✅ Parameterized queries (SQL injection prevention)

### Session Security
1. ✅ Short token expiration (15 minutes)
2. ✅ Refresh token rotation capability
3. ✅ Token revocation support
4. ✅ Secure token storage

## Database Schema Changes

### New Tables

**login_attempts**
```sql
CREATE TABLE login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_ic VARCHAR(12) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  timestamp DATETIME NOT NULL,
  successful TINYINT(1) DEFAULT 0,
  INDEX idx_user_ic (user_ic),
  INDEX idx_timestamp (timestamp)
)
```

**refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  user_ic VARCHAR(12) PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_expires_at (expires_at)
)
```

### Modified Tables

**users**
- Added `account_locked_until DATETIME NULL` column

## Configuration

### Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For token signing
- `NODE_ENV` - For environment-specific behavior

### Security Constants

```javascript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
```

## Migration Guide

### Automatic Setup

All security features are automatically initialized on server startup:
- Login attempts table created
- Refresh tokens table created
- Account lockout column added to users table

### No Breaking Changes

All enhancements are backward compatible:
- Existing tokens continue to work
- Old passwords automatically migrated
- No user action required

## Testing Recommendations

### Account Lockout
1. Attempt login with wrong password 5 times
2. Verify account is locked
3. Verify lockout message
4. Wait 15 minutes or use admin unlock
5. Verify successful login clears lockout

### Password Policy
1. Test weak passwords (should be rejected)
2. Test strong passwords (should be accepted)
3. Test minimum length requirement
4. Test maximum length requirement

### Token Security
1. Test token expiration (15 minutes)
2. Test refresh token functionality
3. Test token revocation
4. Verify old tokens don't work after refresh

### Security Headers
1. Verify all security headers in response
2. Test CSP enforcement
3. Test HSTS header
4. Verify XSS protection

## Monitoring and Alerts

### Recommended Monitoring

1. **Failed Login Attempts**
   - Monitor frequency of failed attempts
   - Alert on unusual patterns
   - Track IP addresses with high failure rates

2. **Account Lockouts**
   - Monitor lockout frequency
   - Alert on repeated lockouts
   - Track lockout patterns

3. **Security Events**
   - Monitor all security log events
   - Alert on suspicious activities
   - Track unauthorized access attempts

## Future Enhancements

Potential additional security features:
1. Two-factor authentication (2FA)
2. IP allowlisting/blocklisting
3. Device fingerprinting
4. Advanced threat detection
5. Security audit reports
6. Password expiration policies
7. Session management dashboard

## Security Contact

For security concerns or vulnerabilities, please contact the development team immediately.

---

**Last Updated:** 2025-12-09
**Version:** 1.0

