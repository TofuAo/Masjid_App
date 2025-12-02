# Forgot Password API - Complete Fix

## ✅ Issues Fixed

1. **Email flow never touches SMS code** - Completely isolated
2. **SMS config checked BEFORE sending** - Returns 400 (not 500) if missing
3. **Explicit method detection** - Uses `isEmailMethod && !isPhoneMethod` to ensure separation
4. **Early returns** - Prevents any code path from reaching the wrong flow

## 📝 Corrected Code

### File: `backend/controllers/authController.js`

#### Key Changes:

1. **Method Detection** (Lines 731-733):
```javascript
// Determine method early - completely separate email and phone flows
const isEmailMethod = emailValue && emailValue.length > 0;
const isPhoneMethod = phoneValue && phoneValue.length > 0;
```

2. **Email Flow** (Lines 816-861):
- Uses `if (isEmailMethod && !isPhoneMethod)` to ensure ONLY email
- Explicit return prevents SMS code from running
- Never calls any SMS function
- Never checks SMS environment variables

3. **SMS Flow** (Lines 863-920):
- Uses `if (isPhoneMethod && !isEmailMethod)` to ensure ONLY SMS
- Checks SMS config BEFORE calling any SMS function
- Returns 400 (not 500) if SMS not configured
- Never calls any email function

## 🔍 Complete Corrected Function

```javascript
export const requestPasswordReset = async (req, res) => {
  try {
    // Remove IC fields again in controller as a safety measure
    if (req.body) {
      delete req.body.icNumber;
      delete req.body.ic_number;
      delete req.body.ic;
    }
    
    console.log('🔍 Forgot password request body:', JSON.stringify(req.body, null, 2));

    const { email, phone } = req.body;

    // Normalize inputs - trim and check if they're actually provided
    const emailValue = email && typeof email === 'string' ? email.trim() : null;
    const phoneValue = phone && typeof phone === 'string' ? phone.trim() : null;

    // Validate that exactly one method is provided
    if (!emailValue && !phoneValue) {
      return res.status(400).json({
        success: false,
        message: 'Sila masukkan sama ada emel atau nombor telefon.'
      });
    }

    if (emailValue && phoneValue) {
      return res.status(400).json({
        success: false,
        message: 'Sila pilih sama ada emel ATAU nombor telefon, bukan kedua-duanya.'
      });
    }

    // Determine method early - completely separate email and phone flows
    const isEmailMethod = emailValue && emailValue.length > 0;
    const isPhoneMethod = phoneValue && phoneValue.length > 0;

    // Find user by email OR phone number
    let query = 'SELECT ic, nama, email, telefon, role FROM users WHERE ';
    let queryParams = [];
    
    if (isEmailMethod) {
      query += 'LOWER(email) = LOWER(?)';
      queryParams.push(emailValue);
    } else if (isPhoneMethod) {
      // Normalize phone number (remove spaces, dashes, parentheses, plus signs)
      const normalizedPhone = phoneValue.replace(/[\s\-()+]/g, '');
      if (normalizedPhone.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Nombor telefon mesti sekurang-kurangnya 8 digit.'
        });
      }
      // Try exact match first, then partial match
      query += '(telefon = ? OR telefon LIKE ? OR REPLACE(REPLACE(REPLACE(REPLACE(telefon, " ", ""), "-", ""), "(", ""), ")", "") = ?)';
      queryParams.push(normalizedPhone, `%${normalizedPhone}%`, normalizedPhone);
    }

    const [users] = await pool.execute(query, queryParams);

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      // Still return success to prevent user enumeration
      return res.json({
        success: true,
        message: isEmailMethod 
          ? 'Jika maklumat yang dimasukkan wujud dalam sistem, kod pengesahan telah dihantar ke emel pendaftaran anda.'
          : 'Jika maklumat yang dimasukkan wujud dalam sistem, kod pengesahan telah dihantar ke nombor telefon pendaftaran anda.'
      });
    }

    const user = users[0];

    // Generate 6-digit verification code (000000-999999)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    const codeExpiresAt = new Date();
    codeExpiresAt.setMinutes(codeExpiresAt.getMinutes() + 5); // Code expires in 5 minutes

    // Generate reset token (still needed for final password reset)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store token and code in database
    try {
      // Try to insert with new schema (verification_code)
      try {
        await pool.execute(
          'INSERT INTO password_reset_tokens (user_ic, token, verification_code, expires_at, code_expires_at) VALUES (?, ?, ?, ?, ?)',
          [user.ic, resetToken, verificationCode, expiresAt, codeExpiresAt]
        );
      } catch (schemaError) {
        // If columns don't exist, try old schema
        if (schemaError.code === 'ER_BAD_FIELD_ERROR') {
          console.warn('⚠️ Database schema not updated. Using fallback. Please run migration: database/migration_add_verification_code.sql');
          await pool.execute(
            'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
            [user.ic, resetToken, expiresAt]
          );
        } else {
          throw schemaError;
        }
      }
    } catch (dbError) {
      console.error('Error storing reset token:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Ralat sistem. Sila cuba lagi kemudian.'
      });
    }

    console.log('\n🔐 ===== PASSWORD RESET REQUEST =====');
    console.log('User IC:', user.ic);
    console.log('User Name:', user.nama);
    console.log('Verification Code:', verificationCode);
    console.log('Code expires at:', codeExpiresAt);
    console.log('Method:', isEmailMethod ? 'EMAIL' : 'SMS');
    
    // ========================================
    // EMAIL FLOW - Completely separate, no SMS code touched
    // IMPORTANT: This block ONLY runs when email is provided, NEVER touches SMS
    // ========================================
    if (isEmailMethod && !isPhoneMethod) {
      const targetEmail = emailValue.toLowerCase();
      
      console.log('📧 EMAIL METHOD SELECTED - Sending verification code via EMAIL ONLY...');
      console.log('Target Email:', targetEmail);
      console.log('⚠️ SMS functions will NOT be called in this flow');
      
      // ONLY call email function - NO SMS code here
      const sendResult = await sendPasswordResetCode(targetEmail, verificationCode, user.nama, user.ic);

      if (!sendResult.success) {
        console.error('\n❌ FAILED TO SEND PASSWORD RESET EMAIL');
        console.error('Error:', sendResult.error);
        console.error('Error code:', sendResult.code);
        console.error('=====================================\n');
        
        // Check if email service is not configured
        if (sendResult.error === 'Transporter not available' || sendResult.message === 'Email service not configured') {
          console.error('⚠️ Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
          return res.status(503).json({
            success: false,
            message: 'Perkhidmatan emel tidak dikonfigurasi. Sila hubungi pentadbir sistem.',
            error: process.env.NODE_ENV === 'development' ? 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD.' : undefined
          });
        }
        
        // Other email errors
        return res.status(500).json({
          success: false,
          message: 'Gagal menghantar emel reset kata laluan. Sila cuba lagi kemudian.',
          error: process.env.NODE_ENV === 'development' ? sendResult.error : undefined
        });
      }

      console.log('✅ Password reset email sent successfully');
      console.log('Message ID:', sendResult.messageId);
      console.log('=====================================\n');

      // EXPLICIT RETURN - ensures SMS code is never reached
      return res.json({
        success: true,
        message: 'Kod pengesahan telah dihantar ke emel anda.'
      });
    }

    // ========================================
    // SMS FLOW - Completely separate, no email code touched
    // IMPORTANT: This block ONLY runs when phone is provided, NEVER touches email
    // ========================================
    if (isPhoneMethod && !isEmailMethod) {
      console.log('📱 PHONE METHOD SELECTED - Sending verification code via SMS ONLY...');
      console.log('Target Phone:', phoneValue);
      console.log('⚠️ Email functions will NOT be called in this flow');
      
      // Check SMS configuration BEFORE attempting to send or calling any SMS function
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.error('⚠️ SMS service is not configured. Missing Twilio credentials.');
        console.error('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'MISSING');
        console.error('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set (hidden)' : 'MISSING');
        console.error('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'MISSING');
        console.error('=====================================\n');
        return res.status(400).json({
          success: false,
          message: 'Perkhidmatan SMS tidak dikonfigurasi.'
        });
      }

      console.log('📱 SMS configuration verified. Sending verification code via SMS...');
      
      // ONLY call SMS function - NO email code here
      const sendResult = await sendPasswordResetCodeSMS(phoneValue, verificationCode, user.nama);

      if (!sendResult.success) {
        console.error('\n❌ FAILED TO SEND PASSWORD RESET SMS');
        console.error('Error:', sendResult.error);
        console.error('Error code:', sendResult.code);
        console.error('=====================================\n');
        
        // Check if SMS service is not configured (double check in case env vars changed)
        if (sendResult.error === 'Twilio client not available' || sendResult.message?.includes('not configured')) {
          console.error('⚠️ SMS service is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
          return res.status(400).json({
            success: false,
            message: 'Perkhidmatan SMS tidak dikonfigurasi.'
          });
        }
        
        // Other SMS errors (network, invalid number, etc.)
        return res.status(500).json({
          success: false,
          message: 'Gagal menghantar SMS reset kata laluan. Sila cuba lagi kemudian.',
          error: process.env.NODE_ENV === 'development' ? sendResult.error : undefined
        });
      }

      console.log('✅ Password reset SMS sent successfully');
      console.log('Message SID:', sendResult.messageSid);
      console.log('=====================================\n');

      // EXPLICIT RETURN - ensures no other code is reached
      return res.json({
        success: true,
        message: 'Kod pengesahan telah dihantar ke nombor telefon anda.'
      });
    }

    // This should never be reached, but just in case
    return res.status(400).json({
      success: false,
      message: 'Kaedah penghantaran tidak sah. Sila pilih emel atau nombor telefon.'
    });

  } catch (error) {
    console.error('Request password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ralat sistem. Sila cuba lagi kemudian.'
    });
  }
};
```

## 🔑 Key Improvements

### 1. Explicit Method Separation
- Email: `if (isEmailMethod && !isPhoneMethod)` - ensures ONLY email
- SMS: `if (isPhoneMethod && !isEmailMethod)` - ensures ONLY SMS

### 2. Early SMS Config Check
- SMS config checked BEFORE calling `sendPasswordResetCodeSMS()`
- Returns 400 (not 500) if missing
- No SMS function called if config missing

### 3. Explicit Returns
- Each flow has explicit return statement
- Prevents any code from reaching the wrong flow

### 4. No Cross-Contamination
- Email flow never imports or calls SMS functions
- SMS flow never imports or calls email functions
- Each flow is completely isolated

## 📊 Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "...",
  "error": "..." // only in development mode
}
```

## 🧪 Test Cases

### ✅ Test 1: Email Method (SMS not configured)
**Request:**
```json
POST /auth/forgot-password
{ "email": "user@example.com" }
```

**Expected:**
- ✅ Only email function called
- ✅ No SMS functions called
- ✅ No SMS config checked
- ✅ Email sent (if EMAIL_PASSWORD configured) or 503 error
- ✅ No SMS errors in response

### ✅ Test 2: Phone Method (SMS not configured)
**Request:**
```json
POST /auth/forgot-password
{ "phone": "0123456789" }
```

**Expected:**
- ✅ SMS config checked FIRST (before any SMS function call)
- ✅ Returns 400 with message "Perkhidmatan SMS tidak dikonfigurasi."
- ✅ No 500 error
- ✅ No email functions called
- ✅ Backend continues running normally

### ✅ Test 3: Phone Method (SMS configured)
**Request:**
```json
POST /auth/forgot-password
{ "phone": "0123456789" }
```

**Expected:**
- ✅ SMS config verified
- ✅ SMS sent successfully
- ✅ Returns 200 with success message
- ✅ No email functions called

## 📋 HTTP Status Codes

| Scenario | Status | Message |
|----------|--------|---------|
| Missing email/phone | 400 | "Sila masukkan sama ada emel atau nombor telefon" |
| Both email and phone | 400 | "Sila pilih sama ada emel ATAU nombor telefon..." |
| User not found | 200 | Success (to prevent enumeration) |
| Email service not configured | 503 | "Perkhidmatan emel tidak dikonfigurasi..." |
| **SMS service not configured** | **400** | **"Perkhidmatan SMS tidak dikonfigurasi."** |
| Email send failed (other) | 500 | "Gagal menghantar emel reset kata laluan..." |
| SMS send failed (other) | 500 | "Gagal menghantar SMS reset kata laluan..." |
| Database error | 500 | "Ralat sistem. Sila cuba lagi kemudian." |
| Unexpected error | 500 | "Ralat sistem. Sila cuba lagi kemudian." |

## ✅ Verification Checklist

- [x] Email flow never calls SMS functions
- [x] SMS flow never calls email functions
- [x] SMS config checked BEFORE SMS function call
- [x] SMS missing config returns 400 (not 500)
- [x] Explicit returns prevent cross-flow execution
- [x] Method detection uses `&& !otherMethod` for safety
- [x] All error responses follow standard format
- [x] Backend never crashes on missing SMS config

## 🚀 Deployment

The fix is complete and deployed. Backend has been restarted with the corrected code.

**Test it now:**
1. Select EMAIL → Should only send email (no SMS errors)
2. Select PHONE → Should return 400 if SMS not configured (no 500 crash)

