# SMS Password Reset Setup Guide

This guide explains how to set up phone number-based password reset functionality using Twilio.

## What Has Been Implemented

✅ SMS service integration with Twilio  
✅ Phone reset code generation and storage  
✅ Code verification endpoint  
✅ Frontend page for entering reset code  
✅ Automatic redirect flow after code is sent  
✅ Fallback to simulation mode if Twilio is not configured  

## How It Works

1. User requests password reset via phone number
2. System generates a 6-digit code and stores it (valid for 10 minutes)
3. Code is sent via SMS using Twilio (or simulated if not configured)
4. User is redirected to code entry page
5. User enters code and new password
6. System verifies code and resets password

## Setup Instructions

### Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for a free account (includes $15.50 credit for testing)
3. Verify your email and phone number

### Step 2: Get Your Twilio Credentials

1. Log in to your Twilio Console: [https://console.twilio.com/](https://console.twilio.com/)
2. Go to **Account** → **API Keys & Tokens**
3. Copy your **Account SID** (starts with `AC...`)
4. Create a new **Auth Token** if needed and copy it

### Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select **Malaysia** as the country
3. Choose a phone number (or use a US number for testing)
4. Copy the phone number in E.164 format (e.g., `+60123456789` or `+1234567890`)

### Step 4: Configure Environment Variables

Add the following to your `.env` file in the root directory:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+60123456789
```

**Important:** 
- The phone number must be in E.164 format (starts with `+`)
- For Malaysian numbers, use `+60` followed by the number without the leading `0`
- Example: `012-3456789` becomes `+60123456789`

### Step 5: Restart Backend Container

After updating the `.env` file:

```bash
docker-compose restart backend
```

Or rebuild if needed:

```bash
docker-compose build backend
docker-compose up -d backend
```

### Step 6: Test the Setup

1. Go to the forgot password page
2. Enter an IC number that has a phone number registered
3. Choose "Phone" as the reset method
4. Check your phone for the SMS with the 6-digit code
5. Enter the code on the reset page and set a new password

## Development Mode

If Twilio is not configured, the system will:
- Simulate SMS sending (logs to console)
- Return the code in the response (for testing)
- Still allow password reset to work

This allows you to test the flow without configuring Twilio first.

## Troubleshooting

### SMS Not Sending

1. **Check Twilio credentials:**
   ```bash
   docker-compose exec backend printenv | grep TWILIO
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep SMS
   ```

3. **Verify phone number format:**
   - Must be in E.164 format: `+60123456789`
   - Malaysian numbers: Remove leading `0`, add `+60`
   - Example: `012-3456789` → `+60123456789`

### Common Twilio Errors

- **21211**: Invalid phone number format
  - Solution: Ensure phone number is in E.164 format

- **21608**: Unverified phone number (trial account)
  - Solution: Verify the recipient number in Twilio Console, or upgrade account

- **21408**: Permission denied
  - Solution: Check that your Twilio phone number is active and has SMS capability

### Testing Without Real SMS

In development, if Twilio is not configured:
- The code will be logged to the console
- The code will be included in the API response (check browser console)
- You can use this code to test the reset flow

## Cost Information

- **Twilio Free Trial**: $15.50 credit included
- **SMS in Malaysia**: ~$0.05-0.10 per SMS
- **US Phone Number**: ~$1/month + $0.0075 per SMS
- **Malaysian Phone Number**: Check Twilio pricing page

## Security Notes

- Reset codes expire after 10 minutes
- Codes can only be used once
- Codes are stored securely in the database
- Phone numbers are normalized before sending

## Support

For Twilio-specific issues:
- Twilio Documentation: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- Twilio Support: [https://support.twilio.com/](https://support.twilio.com/)

