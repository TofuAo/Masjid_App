# Quick Email Setup Guide

## Problem
Emails are not being sent because `EMAIL_PASSWORD` is not configured.

## Solution: Set up Gmail App Password

### Step 1: Enable 2-Step Verification on Gmail

1. Go to https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password

1. Still in Security settings, scroll down to **2-Step Verification**
2. Click on **App passwords** (you may need to search for it)
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **Masjid App**
6. Click **Generate**
7. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Add to Backend .env File

1. Open `backend/.env` file
2. Find the line: `EMAIL_PASSWORD=`
3. Replace it with: `EMAIL_PASSWORD=your-16-character-app-password` (remove spaces)
4. Save the file

Example:
```env
EMAIL_USER=syedmuhammadkhalidalyahya@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=Masjid App
```

### Step 4: Restart Backend Container

```bash
docker-compose restart backend
```

### Step 5: Verify

1. Try the password reset feature again
2. Check your email inbox (and spam folder)
3. Check backend logs: `docker-compose logs backend | grep -i email`

## Troubleshooting

### Still not working?

1. **Check backend logs:**
   ```bash
   docker-compose logs backend --tail 50
   ```
   Look for:
   - `❌ Email credentials not configured!`
   - `❌ Email transporter not available`
   - `✅ Email transporter verified successfully`

2. **Verify environment variable:**
   ```bash
   docker exec masjid_backend sh -c "printenv | grep EMAIL"
   ```
   Should show:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM_NAME=Masjid App
   ```

3. **Common issues:**
   - App Password has spaces (remove them)
   - Using regular Gmail password instead of App Password
   - 2-Step Verification not enabled
   - Wrong email address

## Important Notes

- **Never use your regular Gmail password** - always use App Password
- App Passwords are 16 characters (remove spaces when pasting)
- Each App Password is specific to one application
- You can revoke App Passwords individually if needed

