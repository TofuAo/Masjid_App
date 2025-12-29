# Email Configuration Guide

## Current Status
- ✅ EMAIL_USER: khalidkingez@gmail.com
- ✅ EMAIL_PASSWORD: Set (16 characters)
- ❌ Gmail Authentication: Failing

## Step-by-Step: Configure Gmail App Password

### Step 1: Generate New Gmail App Password

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/apppasswords
   - Or go to: https://myaccount.google.com/ → Security → App passwords

2. **Sign in** with your Gmail account (khalidkingez@gmail.com)

3. **Generate App Password:**
   - Under "Select app": Choose **Mail**
   - Under "Select device": Choose **Other (Custom name)**
   - Type: **MyMasjidApp** (or any name)
   - Click **Generate**

4. **Copy the App Password:**
   - Google will show a 16-character password like: `abcd efgh ijkl mnop`
   - **IMPORTANT:** Copy it exactly and remove all spaces
   - Example: `abcdefghijklmnop` (no spaces, no hyphens)

### Step 2: Update .env File

1. **Open the .env file:**
   - Location: `C:\MyMasjidApp\backend\.env`
   - This file is hidden (starts with a dot)

2. **Find these lines:**
   ```
   EMAIL_USER=khalidkingez@gmail.com
   EMAIL_PASSWORD=your_current_password_here
   ```

3. **Update EMAIL_PASSWORD:**
   - Replace `your_current_password_here` with your new App Password
   - **NO SPACES** - remove all spaces from the password
   - **NO QUOTES** - don't wrap it in quotes
   - Example:
     ```
     EMAIL_PASSWORD=abcdefghijklmnop
     ```

4. **Save the file**

### Step 3: Restart Backend

After updating the .env file, restart the backend:

```bash
docker-compose restart backend
```

Or rebuild if needed:

```bash
docker-compose build backend
docker-compose up -d backend
```

### Step 4: Test Email Configuration

Test if email is working:

```bash
docker-compose exec backend node test-email.js
```

You should see:
- ✅ Authentication successful
- ✅ Test email sent

## Troubleshooting

### Still Getting Authentication Error?

1. **Verify 2-Step Verification is enabled:**
   - Go to: https://myaccount.google.com/security
   - Check that "2-Step Verification" shows "On"

2. **Check App Password:**
   - Make sure it's exactly 16 characters
   - No spaces or special characters
   - It's an App Password, not your regular Gmail password

3. **Regenerate App Password:**
   - Delete the old App Password
   - Generate a new one
   - Update .env file
   - Restart backend

4. **Check .env File Location:**
   - Make sure it's in: `backend/.env` (not `backend/env` or `.env` in root)
   - File should be named exactly `.env` (with the dot)

5. **Verify File Format:**
   - No extra spaces around the `=` sign
   - No quotes around values
   - Each variable on its own line

### Example .env File Format

```env
# Email Configuration
EMAIL_USER=khalidkingez@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=e-Sistem Kelas Pengajian Al-quran
```

## Quick Reference

**Current Configuration:**
- Email: khalidkingez@gmail.com
- Status: App Password needed

**After Configuration:**
- Email will be sent when users request password reset
- Reset links will be delivered via email
- No need to show reset links in UI (they'll be in email)

## Need Help?

If you're still having issues:
1. Check backend logs: `docker-compose logs backend --tail=50`
2. Look for email-related errors
3. Verify the App Password is correct
4. Make sure 2-Step Verification is enabled

