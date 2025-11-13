# Email Configuration Setup

The forgot password feature requires email credentials to be configured. Follow these steps to set up email:

## Option 1: Using .env file (Recommended)

1. Create a `.env` file in the root directory of the project (same level as `docker-compose.yml`)

2. Add the following variables:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM_NAME=Masjid App
```

3. Restart the backend container:
```bash
docker-compose restart backend
```

## Option 2: Set environment variables directly

Export the variables before running docker-compose:

**Windows PowerShell:**
```powershell
$env:EMAIL_USER="your-email@gmail.com"
$env:EMAIL_PASSWORD="your-gmail-app-password"
$env:EMAIL_FROM_NAME="Masjid App"
docker-compose restart backend
```

**Linux/Mac:**
```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-gmail-app-password"
export EMAIL_FROM_NAME="Masjid App"
docker-compose restart backend
```

## Getting Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Use this 16-character password as `EMAIL_PASSWORD`

## Important Notes

- **Never commit `.env` file to git** - it contains sensitive credentials
- Use a Gmail App Password, not your regular Gmail password
- The email must have 2-Step Verification enabled
- For production, use environment variables or a secrets management system

## Testing Email Configuration

After setting up, test the forgot password feature. If email is not configured, you'll see:
- Error message: "Perkhidmatan emel tidak dikonfigurasi. Sila hubungi pentadbir sistem."
- Backend logs will show: "❌ Email credentials not configured!"

## Troubleshooting

If emails still don't send:
1. Check backend logs: `docker-compose logs backend | Select-String -Pattern "email|Email"`
2. Verify EMAIL_USER and EMAIL_PASSWORD are set: `docker-compose exec backend env | grep EMAIL`
3. Ensure Gmail App Password is correct (16 characters, no spaces)
4. Check that 2-Step Verification is enabled on the Gmail account

