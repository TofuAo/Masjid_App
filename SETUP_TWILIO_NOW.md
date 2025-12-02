# 🚨 URGENT: SMS Setup Required for Phone Password Reset

## Current Status
Your SMS service is **NOT configured** yet. The system is currently in "simulation mode" - codes are shown on screen but not sent via SMS.

## ⚠️ About Your Phone Number (010-271-5677)

**You CANNOT use your personal phone number as the SMS sender.**

To send SMS programmatically, you need:
- A **Twilio account** (FREE trial available)
- A **Twilio phone number** (purchased, ~$1/month)
- Your number (010-271-5677) can be used as a **recipient** for testing

## ✅ Quick Setup (5 Minutes)

### Step 1: Get Twilio Account (FREE - $15.50 Credit)

1. Visit: **https://www.twilio.com/try-twilio**
2. Sign up (takes 2 minutes)
3. Verify your email
4. **You get $15.50 FREE credit!**

### Step 2: Get Your Credentials

1. Go to: **https://console.twilio.com/**
2. On dashboard, copy:
   - **Account SID** (looks like: `AC1234567890abcdef...`)
   - **Auth Token** (click "show" to reveal)

### Step 3: Buy a Malaysian Phone Number

1. In Twilio Console: **Phone Numbers** → **Manage** → **Buy a number**
2. Country: **Malaysia**
3. Click **Search**
4. **Optional:** Search for numbers starting with "010" (like your number)
5. Click **Buy** (costs ~$1/month, comes from your $15.50 credit)

**Note:** If "010-271-5677" isn't available, any Malaysian number works! The format doesn't matter.

### Step 4: Add to Your .env File

Open your **root `.env` file** (same directory as `docker-compose.yml`) and add:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+60123456789
```

**Replace:**
- `ACxxxxxxxx...` → Your Account SID from Step 2
- `your_actual_auth_token_here` → Your Auth Token from Step 2  
- `+60123456789` → Your Twilio phone number from Step 3 (must start with `+60`)

**Example:**
```env
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr
TWILIO_PHONE_NUMBER=+60123456789
```

### Step 5: Restart Backend

```bash
docker-compose restart backend
```

### Step 6: Test It!

1. Go to: `http://localhost/forgot-password`
2. Enter an IC number that has a phone number registered
3. Choose **"Phone"** method
4. **Check your phone** - you should receive SMS with the code!

## 💡 What Happens After Setup

✅ Real SMS sent to users' phones  
✅ Codes delivered instantly  
✅ No more "simulation mode"  
✅ Fully functional password reset!  

## 💰 Cost Breakdown

- **Twilio Account:** FREE (trial)
- **Free Credit:** $15.50 (included)
- **Malaysian Number:** ~$1/month (from credit)
- **SMS Cost:** ~$0.05-0.10 per SMS (from credit)
- **Your $15.50 = ~150-300 SMS** (plenty for testing!)

## 🔍 Verify It's Working

After setup, check logs:
```bash
docker-compose logs backend | findstr SMS
```

You should see:
```
✅ SMS sent successfully! Message SID: SM...
```

## ❓ Troubleshooting

**SMS not sending?**
1. Check credentials: `docker-compose exec backend printenv | findstr TWILIO`
2. Verify number format: Must be `+60123456789` (not `010-271-5677`)
3. Check Twilio console for errors

**Number format:**
- Your number: `010-271-5677`
- Twilio format: `+60102715677` (remove `-`, add `+60`)

## 🎯 Once You Have Credentials

Just add them to `.env` and restart - the code is already ready to work!

