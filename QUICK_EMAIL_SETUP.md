# Quick Email Setup Guide

## Current Issue
Gmail authentication is failing. You need to generate a new Gmail App Password.

## Quick Setup (3 Steps)

### Step 1: Generate Gmail App Password

1. **Open this link:** https://myaccount.google.com/apppasswords
2. **Sign in** with: khalidkingez@gmail.com
3. **Select:**
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: **MyMasjidApp**
4. **Click Generate**
5. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
6. **Remove all spaces** → `abcdefghijklmnop`

### Step 2: Update .env File

1. **Open:** `C:\MyMasjidApp\backend\.env`
2. **Find the line:** `EMAIL_PASSWORD=...`
3. **Replace with:** `EMAIL_PASSWORD=abcdefghijklmnop` (your new App Password, no spaces)
4. **Save the file**

### Step 3: Restart Backend

Run this command:
```bash
docker-compose restart backend
```

## Verify It Works

Test the email configuration:
```bash
docker-compose exec backend node test-email.js
```

You should see:
```
✅ ===== AUTHENTICATION SUCCESSFUL =====
✅ Email transporter verified successfully!
✅ Test email sent successfully!
```

## Alternative: Use Configuration Script

I've created a helper script. Run:
```bash
docker-compose exec backend node configure-email.js
```

This will guide you through the setup interactively.

## Important Notes

⚠️ **DO NOT use your regular Gmail password**
- ❌ Regular password: `yourpassword123`
- ✅ App Password: `abcdefghijklmnop` (16 characters, no spaces)

⚠️ **2-Step Verification MUST be enabled**
- Check: https://myaccount.google.com/security
- If not enabled, enable it first, then generate App Password

⚠️ **Password Format**
- Must be exactly 16 characters
- No spaces, no hyphens
- Copy it exactly as shown (just remove spaces)

## Troubleshooting

**Still not working?**
1. Make sure 2-Step Verification is ON
2. Generate a NEW App Password (delete old one first)
3. Copy the password exactly (no extra characters)
4. Update .env file
5. Restart backend: `docker-compose restart backend`
6. Test again: `docker-compose exec backend node test-email.js`

## After Configuration

Once email is working:
- Password reset emails will be sent automatically
- Users will receive reset links in their email
- No need to show reset links in UI anymore

