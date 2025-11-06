# 🚨 URGENT: Email Setup Required

## Current Status
Your `.env` file has been updated with:
- ✅ `EMAIL_USER=syedmuhammadkhalidalyahya@gmail.com`
- ⚠️ `EMAIL_PASSWORD=YOUR_APP_PASSWORD_HERE` (You need to replace this!)

## 🔧 Step-by-Step Setup Instructions

### Step 1: Generate Gmail App Password

1. **Go to Google Account Security:**
   - Visit: https://myaccount.google.com/security
   - Sign in with: `syedmuhammadkhalidalyahya@gmail.com`

2. **Enable 2-Step Verification (if not already enabled):**
   - Click on **2-Step Verification**
   - Follow the setup process if needed

3. **Create App Password:**
   - Go back to Security page
   - Click on **App passwords** (or search for it)
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **Masjid App Server**
   - Click **Generate**
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Update .env File

1. Open `backend/.env` file
2. Find the line: `EMAIL_PASSWORD=YOUR_APP_PASSWORD_HERE`
3. Replace `YOUR_APP_PASSWORD_HERE` with the 16-character App Password you just copied
4. **Remove all spaces** from the App Password (e.g., `abcdefghijklmnop`)
5. Save the file

Example:
```env
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 3: Restart Backend Server

After updating `.env`, you MUST restart the backend server:

**Option 1: If using Docker:**
```bash
docker-compose restart backend
```

**Option 2: If running directly:**
1. Stop the current backend process (Ctrl+C or kill the process)
2. Start it again:
   ```bash
   cd C:\MyMasjidApp\backend
   npm start
   ```

### Step 4: Verify Configuration

Run the email configuration check:
```bash
cd C:\MyMasjidApp\backend
node check-email-config.js
```

You should see:
```
✅ Email credentials are configured!
```

### Step 5: Test Email Sending

1. Go to the "Lupa Kata Laluan" (Forgot Password) page
2. Enter an IC number that has an email registered
3. Check the backend console logs for email sending status
4. Check the recipient's email inbox (and spam folder)

## 📋 Quick Checklist

- [ ] 2-Step Verification enabled on Gmail account
- [ ] App Password generated (16 characters)
- [ ] `EMAIL_PASSWORD` updated in `backend/.env` file
- [ ] Backend server restarted
- [ ] Email configuration verified
- [ ] Test email sent successfully

## 🔍 Troubleshooting

If emails still don't send after setup:

1. **Check backend console logs** - Look for email-related messages
2. **Verify App Password:**
   - Make sure you're using App Password, not regular password
   - Remove all spaces from the App Password
   - Ensure 2-Step Verification is enabled

3. **Check Gmail settings:**
   - Make sure "Less secure app access" is not needed (use App Password instead)
   - Verify the email account is active

4. **Check spam folder:**
   - Emails might go to spam initially

## 📞 Need Help?

Check the detailed guide: `EMAIL_SETUP_GUIDE.md`

