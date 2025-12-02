# 📱 Twilio SMS Setup Guide

This guide explains how to configure Twilio for SMS functionality in the Masjid App system.

## 🔧 Twilio Configuration

To use Twilio for sending SMS messages, you need to create a Twilio account and get your credentials.

### Step 1: Create Twilio Account

1. Go to [Twilio Website](https://www.twilio.com/try-twilio)
2. Sign up for a free account (free trial includes $15.50 credit)
3. Verify your email address
4. Verify your phone number

### Step 2: Get Your Twilio Credentials

1. Once logged in, go to your [Twilio Console Dashboard](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
   - **Account SID**: Starts with `AC...`
   - **Auth Token**: Click "View" to reveal it (starts with a random string)

### Step 3: Get a Twilio Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Click **Buy a number**
3. Select:
   - **Country**: Malaysia (or your preferred country)
   - **Type**: Phone Number (for SMS)
4. Choose an available number and click **Buy**
5. Note your Twilio phone number (it will be in E.164 format, e.g., `+1234567890`)

### Step 4: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important:** 
- Use your actual Account SID (starts with `AC...`)
- Use your actual Auth Token (from Twilio console)
- Use your Twilio phone number in E.164 format (e.g., `+1234567890`)

### Step 5: Restart Backend

After updating `.env`, restart the backend container:

```bash
docker-compose restart backend
```

## 📨 SMS Features

Once configured, the system will automatically send SMS messages for:

### 1. Password Reset (Forgot Password)
- Users can request password reset via phone number
- Verification code sent via SMS
- Code expires in 10 minutes

## 💰 Twilio Pricing (Malaysia)

- **SMS to Malaysian numbers**: Approximately $0.057 per message
- **Free Trial**: $15.50 credit (enough for ~270 SMS messages)
- **Monthly costs**: Pay-as-you-go pricing

## 🔒 Security Notes

- **Never commit** your `.env` file to version control
- Keep your Auth Token secret
- Consider using Twilio's environment variables for production

## 🧪 Testing

1. Use the "Forgot Password" feature
2. Select "Phone" option
3. Enter a phone number (e.g., `0123456789`)
4. You should receive an SMS with the verification code

## ❓ Troubleshooting

### SMS not sending?
1. Check that all three environment variables are set correctly
2. Verify your Twilio account has credits
3. Check Twilio console logs for error messages
4. Ensure phone number is in correct format (Malaysian: `0XX-XXXXXXX`)

### Invalid phone number error?
- Malaysian phone numbers should be in format: `0123456789` or `012-3456789`
- The system will automatically format it to E.164 format (`+60123456789`)

### SMS service not configured error?
- Make sure all three Twilio environment variables are set
- Restart the backend after updating `.env`

