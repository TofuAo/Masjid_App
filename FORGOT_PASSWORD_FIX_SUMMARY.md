# Forgot Password Flow - Fix Summary

## ✅ Issues Fixed

1. **Email flow no longer depends on SMS config** - Completely separated
2. **SMS errors return 503 (Service Unavailable) instead of 500** - Graceful handling
3. **Clear separation between email and phone flows** - No cross-contamination
4. **Proper error handling with correct HTTP status codes**

## 📝 Updated Files

### 1. `backend/controllers/authController.js`

**Key Changes:**
- ✅ Completely separated email and SMS flows
- ✅ Email flow never touches SMS code
- ✅ SMS flow never touches email code
- ✅ SMS not configured returns 503 (Service Unavailable), not 500
- ✅ Proper validation: exactly one method (email OR phone)
- ✅ Better error messages

**Error Status Codes:**
- `400` - Bad Request (missing input, invalid format)
- `503` - Service Unavailable (SMS/Email service not configured)
- `500` - Internal Server Error (unexpected errors)

## 🔄 Flow Logic

### Email Flow (when `email` is provided):
1. Validate email format
2. Find user by email
3. Generate OTP code
4. Store in database
5. **ONLY** call `sendPasswordResetCode()` (email function)
6. Return success or email-specific error
7. **NEVER** touches SMS code

### SMS Flow (when `phone` is provided):
1. Validate phone format
2. Find user by phone
3. Generate OTP code
4. Store in database
5. **ONLY** call `sendPasswordResetCodeSMS()` (SMS function)
6. If SMS not configured → Return 503 with clear message
7. Return success or SMS-specific error
8. **NEVER** touches email code

## 📋 Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "...",
  "error": "..." // only in development mode
}
```

## 🧪 Test Cases

### ✅ Email Flow (SMS not configured):
- Request: `POST /auth/forgot-password` with `{ "email": "user@example.com" }`
- Expected: Email sent (if EMAIL_PASSWORD configured) or 503 error
- **No SMS errors should appear**

### ✅ SMS Flow (SMS not configured):
- Request: `POST /auth/forgot-password` with `{ "phone": "0123456789" }`
- Expected: 503 error with message "Perkhidmatan SMS tidak tersedia pada masa ini..."
- **No 500 crash, graceful error**

### ✅ Email Flow (Email not configured):
- Request: `POST /auth/forgot-password` with `{ "email": "user@example.com" }`
- Expected: 503 error with message "Perkhidmatan emel tidak dikonfigurasi..."
- **No SMS errors should appear**

## 🔍 Key Improvements

1. **Early method detection** - Determines email vs phone before any service calls
2. **Separate code paths** - Email and SMS flows are completely independent
3. **Graceful degradation** - Missing SMS config doesn't crash the server
4. **Clear error messages** - Users know exactly what went wrong
5. **Proper HTTP status codes** - 503 for service unavailable, 500 for unexpected errors

## 📊 Status Code Reference

| Scenario | Status Code | Message |
|----------|-------------|---------|
| Missing email/phone | 400 | "Sila masukkan sama ada emel atau nombor telefon" |
| Both email and phone provided | 400 | "Sila pilih sama ada emel ATAU nombor telefon..." |
| User not found | 200 | Success (to prevent enumeration) |
| Email service not configured | 503 | "Perkhidmatan emel tidak dikonfigurasi..." |
| SMS service not configured | 503 | "Perkhidmatan SMS tidak tersedia pada masa ini..." |
| Email send failed (other) | 500 | "Gagal menghantar emel reset kata laluan..." |
| SMS send failed (other) | 500 | "Gagal menghantar SMS reset kata laluan..." |
| Database error | 500 | "Ralat sistem. Sila cuba lagi kemudian." |
| Unexpected error | 500 | "Ralat sistem. Sila cuba lagi kemudian." |

