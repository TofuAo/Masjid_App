# 🔐 Complete Reset Password Feature Guide

This guide covers the complete Reset Password feature implementation with OTP verification via Email or SMS.

## 📋 Feature Overview

The Reset Password feature allows users to reset their password using a 6-digit OTP code sent via:
- **Email** (SMTP)
- **SMS** (Twilio)

### Key Features:
- ✅ 6-digit OTP code (000000-999999)
- ✅ OTP expires in 5 minutes
- ✅ User chooses delivery method (Email or SMS)
- ✅ OTP can only be used once
- ✅ Password updates only after OTP verification
- ✅ Full validation and error handling

## 🏗️ Architecture

### Backend Endpoints

The system supports both new and legacy endpoint names for backward compatibility:

#### 1. Request Reset (Send OTP)
- **New:** `POST /auth/request-reset`
- **Legacy:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"  // OR
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod pengesahan telah dihantar ke emel anda."
}
```

#### 2. Verify Reset Code
- **New:** `POST /auth/verify-reset`
- **Legacy:** `POST /auth/verify-reset-code`

**Request Body:**
```json
{
  "code": "123456",
  "email": "user@example.com"  // OR
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod pengesahan berjaya disahkan.",
  "data": {
    "token": "reset_token_here"
  }
}
```

#### 3. Set New Password
- **New:** `POST /auth/set-password`
- **Legacy:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_step_2",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kata laluan telah berjaya ditetapkan semula."
}
```

### Frontend Flow

The reset password flow consists of 4 steps:

1. **Step 1:** User enters email or phone number
2. **Step 2:** User chooses delivery method (Email or SMS)
3. **Step 3:** User enters 6-digit OTP code
4. **Step 4:** User sets new password and confirms

**Access the flow:**
- New flow: `/reset-password-flow`
- Legacy flow: `/forgot-password` (existing implementation)

## 🔧 Environment Configuration

### Required Environment Variables

Add these to your `backend/.env` file:

#### Email Configuration (SMTP)
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Masjid App
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/
2. Security → 2-Step Verification (enable if not enabled)
3. App passwords → Generate new app password
4. Select "Mail" and "Other (Custom name)"
5. Name it "Masjid App"
6. Copy the 16-character password (remove spaces)

#### SMS Configuration (Twilio)
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**How to get Twilio credentials:**
1. Sign up at https://www.twilio.com/
2. Get Account SID and Auth Token from dashboard
3. Get a phone number from Twilio (or use trial number)
4. Format: `TWILIO_PHONE_NUMBER=+1234567890` (include + and country code)

### Complete `.env` Example

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Masjid App

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🗄️ Database Schema

The system uses the `password_reset_tokens` table:

```sql
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    verification_code VARCHAR(6) NULL,
    code_verified BOOLEAN DEFAULT FALSE,
    code_expires_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_ic (user_ic),
    INDEX idx_verification_code (verification_code),
    INDEX idx_expires_at (expires_at)
);
```

**Key Fields:**
- `verification_code`: 6-digit OTP (000000-999999)
- `code_expires_at`: OTP expiry (5 minutes from creation)
- `code_verified`: Whether OTP has been verified
- `token`: Reset token (24 hours expiry)
- `used`: Whether token has been used to reset password

## 🧪 Testing with Postman

### Step 1: Request Reset (Send OTP)

**Request:**
```
POST http://localhost:5000/api/auth/request-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**OR for SMS:**
```json
{
  "phone": "0123456789"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kod pengesahan telah dihantar ke emel anda."
}
```

**Check:**
- Email inbox (or SMS) for 6-digit code
- Database `password_reset_tokens` table for stored code

### Step 2: Verify OTP Code

**Request:**
```
POST http://localhost:5000/api/auth/verify-reset
Content-Type: application/json

{
  "code": "123456",
  "email": "user@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kod pengesahan berjaya disahkan.",
  "data": {
    "token": "abc123def456..."
  }
}
```

**Save the `token` for Step 3!**

### Step 3: Set New Password

**Request:**
```
POST http://localhost:5000/api/auth/set-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "newpassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kata laluan telah berjaya ditetapkan semula."
}
```

### Error Responses

**Invalid OTP:**
```json
{
  "success": false,
  "message": "Kod pengesahan tidak sah atau telah tamat tempoh."
}
```

**Expired OTP:**
```json
{
  "success": false,
  "message": "Kod pengesahan tidak sah atau telah tamat tempoh."
}
```

**Invalid Token:**
```json
{
  "success": false,
  "message": "Token tidak sah atau kod pengesahan belum disahkan."
}
```

## 📱 Frontend Usage

### Using the New Flow Component

```jsx
import { Link } from 'react-router-dom';

// Link to reset password flow
<Link to="/reset-password-flow">Lupa Kata Laluan?</Link>
```

### Using the API Directly

```javascript
import { authAPI } from './services/api';

// Step 1: Request reset
const response1 = await authAPI.requestReset({
  email: 'user@example.com'
});

// Step 2: Verify code
const response2 = await authAPI.verifyReset({
  code: '123456',
  email: 'user@example.com'
});

// Step 3: Set password
const response3 = await authAPI.setPassword({
  token: response2.data.token,
  newPassword: 'newpassword123'
});
```

## 🔒 Security Features

1. **OTP Expiry:** 5 minutes
2. **Token Expiry:** 24 hours
3. **One-time Use:** OTP and token can only be used once
4. **Rate Limiting:** Password reset requests are rate-limited
5. **No User Enumeration:** Same response for valid/invalid users
6. **Password Hashing:** Bcrypt with 12 rounds
7. **Input Validation:** All inputs validated and sanitized

## 🐛 Troubleshooting

### Email Not Sending

1. **Check Gmail App Password:**
   - Ensure 2-Step Verification is enabled
   - Verify App Password is correct (16 characters, no spaces)
   - Check `EMAIL_USER` is correct Gmail address

2. **Check Backend Logs:**
   ```bash
   docker-compose logs backend | grep -i email
   ```

3. **Test Email Configuration:**
   ```bash
   cd backend
   node check-email-config.js
   ```

### SMS Not Sending

1. **Check Twilio Credentials:**
   - Verify `TWILIO_ACCOUNT_SID` is correct
   - Verify `TWILIO_AUTH_TOKEN` is correct
   - Check `TWILIO_PHONE_NUMBER` format: `+1234567890`

2. **Check Twilio Account:**
   - Ensure account is active (not trial with restrictions)
   - Verify phone number is verified in Twilio
   - Check Twilio dashboard for error messages

3. **Check Backend Logs:**
   ```bash
   docker-compose logs backend | grep -i sms
   ```

### OTP Not Working

1. **Check Database:**
   ```sql
   SELECT * FROM password_reset_tokens 
   WHERE user_ic = 'user_ic_here' 
   ORDER BY created_at DESC LIMIT 1;
   ```

2. **Verify OTP Format:**
   - Must be exactly 6 digits
   - Must be numeric only (000000-999999)

3. **Check Expiry:**
   - OTP expires in 5 minutes
   - Token expires in 24 hours

### Mock SMS (Development)

If Twilio is not configured, the system will return an error. For development, you can:

1. **Check backend logs** - OTP code is logged to console
2. **Query database** - OTP is stored in `password_reset_tokens.verification_code`
3. **Use email** - Email works without additional setup (if Gmail configured)

## 📊 Database Queries

### Check Active Reset Tokens
```sql
SELECT 
    prt.id,
    prt.user_ic,
    u.nama,
    u.email,
    prt.verification_code,
    prt.code_verified,
    prt.code_expires_at,
    prt.expires_at,
    prt.used,
    prt.created_at
FROM password_reset_tokens prt
JOIN users u ON prt.user_ic = u.ic
WHERE prt.expires_at > NOW()
ORDER BY prt.created_at DESC;
```

### Clean Expired Tokens
```sql
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() OR code_expires_at < NOW();
```

## 🚀 Deployment

After configuring environment variables:

1. **Restart Backend:**
   ```bash
   docker-compose restart backend
   ```

2. **Verify Services:**
   ```bash
   docker-compose ps
   ```

3. **Check Logs:**
   ```bash
   docker-compose logs backend
   ```

## 📝 Notes

- OTP codes are always 6 digits (000000-999999)
- OTP expires in 5 minutes
- Reset token expires in 24 hours
- Each OTP/token can only be used once
- Users must verify OTP before setting new password
- System supports both email and SMS delivery
- Legacy endpoints still work for backward compatibility

## 🔗 Related Files

- Backend Controller: `backend/controllers/authController.js`
- Backend Routes: `backend/routes/auth.js`
- Email Service: `backend/utils/emailService.js`
- SMS Service: `backend/utils/smsService.js`
- Frontend Component: `src/pages/ResetPasswordFlow.jsx`
- Frontend API: `src/services/api.js`

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0

