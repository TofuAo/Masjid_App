# 📧 Email/Gmail Setup Guide

This guide explains how to configure Gmail integration for the Masjid App system.

## 🔧 Gmail Configuration

To use Gmail for sending emails, you need to create a Gmail App Password.

### Step 1: Enable 2-Step Verification

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification** if not already enabled

### Step 2: Create App Password

1. Still in Security settings, look for **2-Step Verification**
2. Click on **App passwords** (you may need to search for it)
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **Masjid App**
6. Click **Generate**
7. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Masjid App
```

**Important:** 
- Use your full Gmail address for `EMAIL_USER`
- Use the 16-character App Password (remove spaces if any) for `EMAIL_PASSWORD`
- Do NOT use your regular Gmail password

### Step 4: Restart Backend

After updating `.env`, restart the backend container:

```bash
docker-compose restart backend
```

## 📨 Email Features

Once configured, the system will automatically send emails for:

### 1. Password Reset
- Users can request password reset via "Lupa kata laluan?" link on login page
- Reset link sent to their email (valid for 1 hour)

### 2. Payment Confirmations
- Students receive confirmation email when admin marks their fee as paid
- Includes payment details, receipt number, and date

### 3. Welcome Emails (Future)
- New user registration confirmations
- Welcome messages with login credentials

### 4. Payment Reminders (Future)
- Automated reminders for unpaid fees

### 5. Attendance Notifications (Future)
- Daily/weekly attendance summaries

## 🧪 Testing Email Configuration

To test if email is working:

1. Go to login page
2. Click "Lupa kata laluan?"
3. Enter a valid user email
4. Check the email inbox (and spam folder)

If email doesn't arrive:
- Check `backend/.env` has correct credentials
- Verify App Password is correct (16 characters, no spaces)
- Check backend logs: `docker-compose logs backend`
- Ensure 2-Step Verification is enabled on Gmail account

## 🔒 Security Notes

- **Never commit** `.env` file with real credentials
- App Passwords are safer than using your main Gmail password
- App Passwords can be revoked individually if compromised
- Each App Password is specific to one application

## 🐛 Troubleshooting

### Email not sending?
1. Check backend logs: `docker-compose logs backend | grep -i email`
2. Verify `.env` file has correct variables
3. Ensure App Password has no spaces
4. Confirm 2-Step Verification is enabled
5. Try creating a new App Password

### "Email service not configured" warning?
- This is normal if email credentials are not set
- The app will continue to work without email functionality
- Set up Gmail credentials to enable email features

### Emails going to spam?
- This is common with automated emails
- Gmail usually learns after a few emails
- Users should check spam folder initially

## 📝 Alternative Email Providers

You can also use other SMTP providers by modifying `backend/utils/emailService.js`:

- **SendGrid**: Use `host: 'smtp.sendgrid.net'`
- **Mailgun**: Use `host: 'smtp.mailgun.org'`
- **Outlook/Office365**: Use `service: 'hotmail'`
- **Custom SMTP**: Configure host, port, and auth manually

