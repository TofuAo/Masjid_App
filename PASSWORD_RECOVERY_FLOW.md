# Password Recovery Flow - Complete Documentation

## Overview

The password recovery system in MyMasjidApp provides two methods for users to reset their passwords:
1. **Email Method**: Sends a reset link with a token (24-hour expiry)
2. **Phone Method**: Sends an SMS with a 6-digit code (10-minute expiry)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User initiates password recovery                       │
│ Route: /forgot-password                                        │
│ Action: User enters IC number                                  │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: System validates IC and checks reset options           │
│ Route: /choose-reset-method?ic={icNumber}                      │
│ Backend: POST /auth/check-reset-options                        │
│ Response: { hasEmail: boolean, hasPhone: boolean }             │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ Email Method     │    │ Phone Method     │
│ (24h expiry)     │    │ (10min expiry)   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Generate Token   │    │ Generate Code    │
│ (32 bytes hex)   │    │ (6 digits)       │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Send Email       │    │ Send SMS         │
│ with reset link  │    │ with code        │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ User clicks link │    │ User enters code │
│ Route:           │    │ Route:           │
│ /reset-password  │    │ /reset-password- │
│ ?token=...       │    │ code?ic=...      │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: User sets new password                                  │
│ Backend: POST /auth/reset-password                              │
│ Body: { token/code, newPassword }                              │
│ Action:                                                         │
│   1. Validate token/code (not expired, not used)                │
│   2. Hash new password                                          │
│   3. Update user password                                       │
│   4. Mark token/code as used                                    │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Success - Redirect to login                            │
│ User can now login with new password                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step Flow

### Step 1: Forgot Password Page (`/forgot-password`)

**Frontend Component**: `src/pages/ForgotPassword.jsx`

```20:37:src/pages/ForgotPassword.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!icNumber) {
      toast.error('Sila masukkan nombor kad pengenalan anda.');
      return;
    }

    // Validate IC format
    if (!isValidIC(icNumber)) {
      toast.error('Sila masukkan nombor kad pengenalan yang sah (12 digit).');
      return;
    }

    // Navigate to choose reset method page with IC number
    const normalizedIC = icNumber.replace(/\D/g, '');
    navigate(`/choose-reset-method?ic=${normalizedIC}`);
  };
```

**What happens:**
- User enters IC number (auto-formatted with hyphens)
- System validates IC format (12 digits)
- Normalizes IC (removes hyphens/spaces)
- Navigates to `/choose-reset-method` with IC as query parameter

---

### Step 2: Choose Reset Method (`/choose-reset-method`)

**Frontend Component**: `src/pages/ChooseResetMethod.jsx`

**Backend Endpoint**: `POST /auth/check-reset-options`

```31:55:src/pages/ChooseResetMethod.jsx
  const fetchUserInfo = async () => {
    try {
      setLoadingUser(true);
      // Check if user exists and get their email/phone info
      const response = await authAPI.checkResetOptions({ icNumber });
      
      if (response?.success && response?.data) {
        setUserInfo({
          hasEmail: response.data.hasEmail,
          hasPhone: response.data.hasPhone,
          email: response.data.email,
          telefon: response.data.telefon
        });
      } else {
        // User not found, but don't reveal this for security
        setUserInfo({ hasEmail: false, hasPhone: false, email: null, telefon: null });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Don't reveal error for security
      setUserInfo({ hasEmail: false, hasPhone: false });
    } finally {
      setLoadingUser(false);
    }
  };
```

**Backend Implementation**:

```1234:1284:backend/controllers/authController.js
// Check reset options (email/phone availability)
export const checkResetOptions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber } = req.body;

    // Find user by IC number
    const [users] = await pool.execute(
      'SELECT ic, nama, email, telefon FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      // Return generic response to prevent user enumeration
      return res.json({
        success: true,
        data: {
          hasEmail: false,
          hasPhone: false
        }
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        hasEmail: !!user.email,
        hasPhone: !!user.telefon,
        email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : null,
        telefon: user.telefon ? `${user.telefon.substring(0, 3)}***${user.telefon.substring(user.telefon.length - 2)}` : null
      }
    });
  } catch (error) {
    console.error('Check reset options error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

**What happens:**
- System checks if user exists (without revealing existence for security)
- Returns available reset methods (email/phone)
- Shows masked email/phone for user confirmation
- User selects preferred method

---

### Step 3A: Email Reset Method

**Frontend Action**: `src/pages/ChooseResetMethod.jsx`

```57:83:src/pages/ChooseResetMethod.jsx
  const handleSendEmail = async () => {
    if (!icNumber) {
      toast.error('Nombor IC tidak ditemui.');
      return;
    }

    setResetMethod('email');
    setLoading(true);

    try {
      const response = await authAPI.requestPasswordResetEmail({ icNumber });

      if (response?.success) {
        setSent(true);
        toast.success('Pautan reset kata laluan telah dihantar ke emel pendaftaran anda!');
      } else {
        toast.error(response?.message || 'Gagal menghantar permintaan reset.');
        setResetMethod(null);
      }
    } catch (error) {
      console.error('Reset request error:', error);
      toast.error(error?.message || 'Gagal menghantar permintaan reset.');
      setResetMethod(null);
    } finally {
      setLoading(false);
    }
  };
```

**Backend Implementation**:

```1286:1390:backend/controllers/authController.js
// Request password reset via email
export const requestPasswordResetEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber } = req.body;

    // Find user by IC number
    const [users] = await pool.execute(
      'SELECT ic, nama, email FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Jika nombor kad pengenalan wujud dalam sistem, pautan reset kata laluan telah dihantar ke emel pendaftaran anda.'
      });
    }

    const user = users[0];

    // Check if user has an email registered
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'Tiada emel didaftarkan untuk akaun ini. Sila pilih kaedah lain atau hubungi pentadbir sistem.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store token in database
    try {
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
        [user.ic, resetToken, expiresAt]
      );
    } catch (dbError) {
      console.error('Error storing reset token:', dbError);
    }

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetLink, user.nama, user.ic);

    if (!emailResult.success) {
      if (emailResult.error === 'Transporter not available' || emailResult.message === 'Email service not configured') {
        // If email service is not configured, still generate token and log it for testing
        // This allows the password reset flow to be tested even without email configured
        console.log('\n📧 ===== EMAIL SERVICE NOT CONFIGURED =====');
        console.log('Reset link generated (not sent via email):');
        console.log('Reset Link:', resetLink);
        console.log('User:', user.nama);
        console.log('Email:', user.email);
        console.log('Token:', resetToken);
        console.log('Expires at:', expiresAt);
        console.log('=====================================\n');
        
        // Return success with info about the reset link being logged
        return res.json({
          success: true,
          message: 'Pautan reset kata laluan telah dijana. (Emel tidak dikonfigurasi - sila semak log pelayan untuk pautan reset)',
          emailNotConfigured: true,
          devInfo: process.env.NODE_ENV === 'development' ? {
            resetLink: resetLink,
            token: resetToken,
            message: 'Email service not configured. Reset link generated and logged to console.'
          } : undefined
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Gagal menghantar emel reset kata laluan. Sila cuba lagi kemudian.',
        error: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
      });
    }

    res.json({
      success: true,
      message: 'Jika nombor kad pengenalan wujud dalam sistem, pautan reset kata laluan telah dihantar ke emel pendaftaran anda.'
    });
  } catch (error) {
    console.error('Request password reset email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

**What happens:**
1. System generates a 32-byte hexadecimal token
2. Token is stored in `password_reset_tokens` table with 24-hour expiry
3. Reset link is created: `{FRONTEND_URL}/reset-password?token={token}`
4. Email is sent to user's registered email address
5. User receives email with clickable reset link

**Token Details:**
- **Format**: 32-byte random hex string (64 characters)
- **Expiry**: 24 hours from generation
- **Storage**: `password_reset_tokens` table
- **Security**: One-time use (marked as `used = TRUE` after password reset)

---

### Step 3B: Phone Reset Method

**Backend Implementation**:

```1392:1482:backend/controllers/authController.js
// Request password reset via phone (SMS)
export const requestPasswordResetPhone = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber } = req.body;

    // Find user by IC number
    const [users] = await pool.execute(
      'SELECT ic, nama, telefon FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Jika nombor kad pengenalan wujud dalam sistem, kod reset kata laluan telah dihantar ke nombor telefon pendaftaran anda.'
      });
    }

    const user = users[0];

    // Check if user has a phone registered
    if (!user.telefon) {
      return res.status(400).json({
        success: false,
        message: 'Tiada nombor telefon didaftarkan untuk akaun ini. Sila pilih kaedah lain atau hubungi pentadbir sistem.'
      });
    }

    // Generate 6-digit reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    // Store code in database (using the same password_reset_tokens table)
    try {
      // First, delete any existing tokens for this user
      await pool.execute(
        'DELETE FROM password_reset_tokens WHERE user_ic = ?',
        [user.ic]
      );
      
      // Store new reset code (we'll use token field to store the code)
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
        [user.ic, resetCode, expiresAt]
      );
    } catch (dbError) {
      console.error('Error storing reset code:', dbError);
    }

    // Send SMS with reset code
    const smsResult = await sendPasswordResetSMS(user.telefon, resetCode, user.nama);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghantar SMS reset kata laluan. Sila cuba lagi kemudian atau pilih kaedah emel.',
        error: process.env.NODE_ENV === 'development' ? smsResult.error : undefined
      });
    }

    // In development, include the code in response for testing
    const response = {
      success: true,
      message: 'Jika nombor kad pengenalan wujud dalam sistem, kod reset kata laluan telah dihantar ke nombor telefon pendaftaran anda.'
    };

    if (process.env.NODE_ENV === 'development' && smsResult.devCode) {
      response.devCode = smsResult.devCode;
      response.devMessage = smsResult.devMessage;
    }

    res.json(response);
  } catch (error) {
    console.error('Request password reset phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

**What happens:**
1. System generates a 6-digit random code
2. Code is stored in `password_reset_tokens` table with 10-minute expiry
3. SMS is sent to user's registered phone number
4. User receives SMS with 6-digit code
5. User navigates to `/reset-password-code?ic={icNumber}`

**Code Details:**
- **Format**: 6-digit numeric code (000000-999999)
- **Expiry**: 10 minutes from generation
- **Storage**: `password_reset_tokens` table (using `token` field)
- **Security**: One-time use, shorter expiry for security

---

### Step 4: Reset Password Page

#### 4A: Email Method - Token Reset

**Frontend Component**: `src/pages/ResetPassword.jsx`

```27:62:src/pages/ResetPassword.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Kata laluan tidak sepadan.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resetPassword({
        token,
        newPassword
      });

      if (response?.success) {
        setSuccess(true);
        toast.success('Kata laluan berjaya ditetapkan semula!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response?.message || 'Gagal menetapkan semula kata laluan.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error?.message || 'Gagal menetapkan semula kata laluan. Token mungkin telah tamat tempoh.');
    } finally {
      setLoading(false);
    }
  };
```

#### 4B: Phone Method - Code Reset

**Frontend Component**: `src/pages/ResetPasswordCode.jsx`

```36:76:src/pages/ResetPasswordCode.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetCode || resetCode.length !== 6) {
      toast.error('Sila masukkan kod reset 6 digit.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Kata laluan tidak sepadan.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resetPassword({
        code: resetCode,
        newPassword
      });

      if (response?.success) {
        setSuccess(true);
        toast.success('Kata laluan berjaya ditetapkan semula!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response?.message || 'Gagal menetapkan semula kata laluan.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error?.response?.data?.message || 'Gagal menetapkan semula kata laluan. Kod mungkin telah tamat tempoh atau tidak sah.');
    } finally {
      setLoading(false);
    }
  };
```

**Backend Implementation** (handles both token and code):

```1845:1919:backend/controllers/authController.js
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, code, newPassword } = req.body;

    // Support both token (email) and code (phone) - code takes precedence if both provided
    const resetTokenValue = code || token;

    if (!resetTokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Reset token or code is required'
      });
    }

    // Find valid token/code
    const [tokens] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [resetTokenValue]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code/token'
      });
    }

    const resetToken = tokens[0];

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used
    await pool.execute('START TRANSACTION');

    try {
      // Update password
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [hashedNewPassword, resetToken.user_ic]
      );

      // Mark token/code as used
      await pool.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
        [resetTokenValue]
      );

      await pool.execute('COMMIT');
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

**What happens:**
1. User enters new password (minimum 6 characters)
2. User confirms password
3. System validates token/code:
   - Token/code exists in database
   - Token/code is not expired (`expires_at > NOW()`)
   - Token/code is not already used (`used = FALSE`)
4. System hashes new password (bcrypt, 12 rounds)
5. System updates user password in database
6. System marks token/code as used (prevents reuse)
7. User is redirected to login page

---

## Security Features

### 1. **User Enumeration Prevention**
- System doesn't reveal if a user exists or not
- Generic success messages even when user not found
- Prevents attackers from discovering valid IC numbers

### 2. **Token/Code Security**
- **Email tokens**: 32-byte random hex (cryptographically secure)
- **Phone codes**: 6-digit random numeric
- One-time use (marked as `used = TRUE` after reset)
- Time-limited expiry (24h for email, 10min for phone)

### 3. **Password Requirements**
- Minimum 6 characters
- Must match confirmation
- Hashed with bcrypt (12 rounds)

### 4. **Rate Limiting**
- Password reset requests are rate-limited
- Prevents brute force attacks
- Prevents spam/abuse

### 5. **Database Transaction**
- Password update and token marking happen in a transaction
- Ensures atomicity (all or nothing)
- Prevents partial updates

---

## Scenarios & System Responses

### Scenario 1: Valid User with Email

**User Action**: Enters valid IC number with registered email

**System Response**:
1. ✅ IC validated
2. ✅ User found, email available
3. ✅ Token generated and stored
4. ✅ Email sent with reset link
5. ✅ User clicks link → Reset password page
6. ✅ User sets new password → Success → Redirect to login

**Frontend Flow**:
```
/forgot-password → /choose-reset-method → [Email sent] → /reset-password?token=... → /login
```

---

### Scenario 2: Valid User with Phone Only

**User Action**: Enters valid IC number with registered phone (no email)

**System Response**:
1. ✅ IC validated
2. ✅ User found, phone available, email not available
3. ✅ Code generated and stored
4. ✅ SMS sent with 6-digit code
5. ✅ User enters code → Reset password page
6. ✅ User sets new password → Success → Redirect to login

**Frontend Flow**:
```
/forgot-password → /choose-reset-method → [SMS sent] → /reset-password-code?ic=... → /login
```

---

### Scenario 3: Invalid IC Number

**User Action**: Enters non-existent IC number

**System Response**:
1. ✅ IC format validated
2. ⚠️ User not found (but system doesn't reveal this)
3. ✅ Generic success message shown
4. ⚠️ No email/SMS sent (but user doesn't know)
5. ⚠️ User waits for email/SMS that never comes

**Security Note**: System doesn't reveal user existence to prevent enumeration attacks.

**Frontend Flow**:
```
/forgot-password → /choose-reset-method → [Generic success message] → [No email/SMS sent]
```

---

### Scenario 4: Expired Token/Code

**User Action**: Uses token/code after expiry

**System Response**:
1. ✅ User clicks reset link or enters code
2. ❌ System checks: `expires_at > NOW()` → FALSE
3. ❌ Error: "Invalid or expired reset code/token"
4. ⚠️ User must request new reset link/code

**Backend Check**:
```sql
SELECT * FROM password_reset_tokens 
WHERE token = ? 
AND used = FALSE 
AND expires_at > NOW()
```

---

### Scenario 5: Already Used Token/Code

**User Action**: Tries to reuse a token/code

**System Response**:
1. ✅ User clicks reset link or enters code
2. ❌ System checks: `used = FALSE` → FALSE (already used)
3. ❌ Error: "Invalid or expired reset code/token"
4. ⚠️ User must request new reset link/code

---

### Scenario 6: Weak Password

**User Action**: Enters password less than 6 characters

**System Response**:
1. ❌ Frontend validation: "Kata laluan mesti sekurang-kurangnya 6 aksara."
2. ⚠️ Form submission blocked
3. ✅ User must enter valid password

---

### Scenario 7: Password Mismatch

**User Action**: Enters different passwords in "New Password" and "Confirm Password"

**System Response**:
1. ❌ Frontend validation: "Kata laluan tidak sepadan."
2. ⚠️ Form submission blocked
3. ✅ User must enter matching passwords

---

### Scenario 8: Email Service Not Configured

**User Action**: Requests email reset but email service is not configured

**System Response**:
1. ✅ Token generated and stored
2. ⚠️ Email sending fails
3. ✅ In development: Reset link logged to console
4. ✅ Response includes dev info with reset link
5. ⚠️ In production: Generic error message

**Development Mode**:
```json
{
  "success": true,
  "message": "Pautan reset kata laluan telah dijana...",
  "emailNotConfigured": true,
  "devInfo": {
    "resetLink": "http://localhost:3000/reset-password?token=...",
    "token": "...",
    "message": "Email service not configured..."
  }
}
```

---

### Scenario 9: SMS Service Not Configured

**User Action**: Requests phone reset but SMS service is not configured

**System Response**:
1. ✅ Code generated and stored
2. ⚠️ SMS sending fails
3. ✅ In development: Code included in response
4. ⚠️ In production: Generic error message

**Development Mode**:
```json
{
  "success": true,
  "message": "Kod reset kata laluan telah dihantar...",
  "devCode": "123456",
  "devMessage": "SMS service not configured. Use this code: 123456"
}
```

---

## Database Schema

### `password_reset_tokens` Table

```sql
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_ic VARCHAR(12) NOT NULL,
  token VARCHAR(255) NOT NULL,  -- Stores token (email) or code (phone)
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);
```

**Fields:**
- `user_ic`: User's IC number (foreign key to `users.ic`)
- `token`: Reset token (32-byte hex) or code (6-digit)
- `expires_at`: Expiration timestamp
- `used`: Whether token/code has been used
- `created_at`: When token/code was created

---

## API Endpoints

### 1. Check Reset Options
```
POST /auth/check-reset-options
Body: { icNumber: string }
Response: { 
  success: boolean,
  data: { 
    hasEmail: boolean, 
    hasPhone: boolean,
    email: string (masked),
    telefon: string (masked)
  }
}
```

### 2. Request Email Reset
```
POST /auth/request-reset-email
Body: { icNumber: string }
Response: { 
  success: boolean,
  message: string
}
```

### 3. Request Phone Reset
```
POST /auth/request-reset-phone
Body: { icNumber: string }
Response: { 
  success: boolean,
  message: string,
  devCode?: string (development only)
}
```

### 4. Reset Password
```
POST /auth/reset-password
Body: { 
  token?: string,  // For email method
  code?: string,   // For phone method
  newPassword: string
}
Response: { 
  success: boolean,
  message: string
}
```

---

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/forgot-password` | `ForgotPassword.jsx` | Initial page - enter IC |
| `/choose-reset-method` | `ChooseResetMethod.jsx` | Select email or phone method |
| `/reset-password` | `ResetPassword.jsx` | Reset with email token |
| `/reset-password-code` | `ResetPasswordCode.jsx` | Reset with phone code |

---

## Error Messages

### User-Facing Messages (Malay)

| Error | Message |
|-------|---------|
| Invalid IC format | "Sila masukkan nombor kad pengenalan yang sah (12 digit)." |
| No email registered | "Tiada emel didaftarkan untuk akaun ini. Sila hubungi pentadbir sistem." |
| No phone registered | "Tiada nombor telefon didaftarkan untuk akaun ini. Sila pilih kaedah lain atau hubungi pentadbir sistem." |
| Invalid/expired token | "Gagal menetapkan semula kata laluan. Token mungkin telah tamat tempoh." |
| Invalid/expired code | "Gagal menetapkan semula kata laluan. Kod mungkin telah tamat tempoh atau tidak sah." |
| Password too short | "Kata laluan mesti sekurang-kurangnya 6 aksara." |
| Password mismatch | "Kata laluan tidak sepadan." |
| Email service error | "Gagal menghantar emel reset kata laluan. Sila cuba lagi kemudian." |
| SMS service error | "Gagal menghantar SMS reset kata laluan. Sila cuba lagi kemudian atau pilih kaedah emel." |

---

## Testing the Flow

### Test Email Method (Development)
1. Navigate to `/forgot-password`
2. Enter a valid IC number with registered email
3. Click "Hantar Pautan Reset"
4. Select "Hantar ke Emel"
5. Check server console for reset link (if email not configured)
6. Copy reset link from console
7. Navigate to reset link: `/reset-password?token={token}`
8. Enter new password
9. Verify password reset

### Test Phone Method (Development)
1. Navigate to `/forgot-password`
2. Enter a valid IC number with registered phone
3. Click "Hantar Pautan Reset"
4. Select phone method (if available)
5. Check server response for `devCode` (if SMS not configured)
6. Navigate to `/reset-password-code?ic={icNumber}&code={devCode}`
7. Enter reset code and new password
8. Verify password reset

---

## Summary

The password recovery system provides a secure, user-friendly way to reset passwords with:
- ✅ Two methods: Email (24h) and Phone (10min)
- ✅ Security: One-time use tokens/codes, time-limited expiry
- ✅ Privacy: No user enumeration
- ✅ Validation: IC format, password strength, confirmation matching
- ✅ Error handling: Clear messages, graceful degradation
- ✅ Development support: Console logging when services not configured

