# 🚀 Quick SMS Setup - Make It Work Now!

## ⚠️ Important: About Phone Numbers

**You CANNOT use your personal phone number (010-271-5677) as the SMS sender.**

SMS services require a **purchased phone number** from a service provider like Twilio. Here's why:
- Personal numbers don't have SMS API access
- SMS providers need verified, purchased numbers
- This prevents spam and ensures delivery

## ✅ Solution: Use Twilio (5 Minutes Setup)

### Step 1: Create Twilio Account (FREE Trial - $15.50 Credit)

1. Go to: https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email and phone number
4. **You get $15.50 FREE credit** (enough for ~150-300 SMS)

### Step 2: Get Your Twilio Credentials

1. Log in to Twilio Console: https://console.twilio.com/
2. On the dashboard, you'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "show" to reveal)

### Step 3: Buy a Malaysian Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select **Malaysia** as country
3. Click **Search**
4. Choose a number (costs ~$1/month)
5. Click **Buy**

**Note:** You can search for numbers starting with "010" but availability varies. Any Malaysian number will work!

### Step 4: Add Credentials to Your .env File

Open your root `.env` file and add:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+60123456789
```

**Important:**
- Replace `ACxxxxxxxx...` with your actual Account SID
- Replace `your_auth_token_here` with your actual Auth Token
- Replace `+60123456789` with your Twilio phone number (must start with `+60`)

### Step 5: Restart Backend

```bash
docker-compose restart backend
```

### Step 6: Test It!

1. Go to forgot password page
2. Enter an IC number with a phone registered
3. Choose "Phone" method
4. Check your phone - you should receive the SMS!

## 💰 Cost Information

- **Twilio Free Trial:** $15.50 credit (FREE)
- **Malaysian Phone Number:** ~$1/month
- **SMS in Malaysia:** ~$0.05-0.10 per SMS
- **Your $15.50 credit = ~150-300 SMS** (plenty for testing!)

## 🔧 Alternative: Use Your Number Format

If you want SMS to appear from a number like `010-271-5677`:
1. Search for numbers starting with "010" in Twilio
2. If available, purchase it
3. Use that number as `TWILIO_PHONE_NUMBER`

**The number format doesn't matter** - any valid Twilio Malaysian number will work!

## ❓ Need Help?

If you get stuck:
1. Check backend logs: `docker-compose logs backend | grep SMS`
2. Verify credentials: `docker-compose exec backend printenv | grep TWILIO`
3. Test Twilio connection in their console

## 🎯 Once Configured

After adding your Twilio credentials:
- ✅ Real SMS will be sent
- ✅ Users receive codes on their phones
- ✅ No more "simulation mode"
- ✅ Fully functional password reset!

