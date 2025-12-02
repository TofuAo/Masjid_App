# ToyyibPay Setup Guide

Complete guide to setting up ToyyibPay payment gateway in your MyMasjidApp.

## Overview

ToyyibPay is a Shariah-compliant payment gateway that supports:
- **FPX** (Online Banking)
- **Credit/Debit Cards**
- **DuitNow QR**
- **E-Wallets** (TNG, Boost, GrabPay)

## Prerequisites

1. **ToyyibPay Account**: You need an active ToyyibPay merchant account
2. **Admin Access**: You must be logged in as an admin user
3. **Secret Key**: From your ToyyibPay dashboard (Settings section)
4. **Category Code**: From your ToyyibPay dashboard

## Step-by-Step Setup

### Step 1: Get Your ToyyibPay Credentials

1. Log in to your [ToyyibPay Dashboard](https://toyyibpay.com/dashboard)
2. Navigate to **Settings** section
3. Copy your **Secret Key** (e.g., `jyeebby0-26sv-qto0-x80t-1sy4926nibyn`)
4. Copy your **Category Code** (found in your category settings)

### Step 2: Access ToyyibPay Settings Page

1. Log in to your MyMasjidApp as an **Admin**
2. In the sidebar, click on **"Tetapan ToyyibPay"** (ToyyibPay Settings)
   - Or navigate directly to: `/toyyibpay-settings`

### Step 3: Configure ToyyibPay

Fill in the following information:

#### Required Fields:

1. **Secret Key** ⭐ (Required)
   - Paste your Secret Key from ToyyibPay dashboard
   - Click the eye icon to show/hide the key
   - Example: `jyeebby0-26sv-qto0-x80t-1sy4926nibyn`

2. **Category Code** ⭐ (Required)
   - Enter your Category Code from ToyyibPay dashboard
   - This is usually a short code like `abc123`

#### Optional Fields:

3. **Return URL**
   - Default: `https://yourdomain.com/payment/return`
   - This is where users are redirected after payment
   - Leave empty to use default

4. **Callback URL**
   - Default: `https://yourdomain.com/api/toyyibpay/callback`
   - This is where ToyyibPay sends payment status updates
   - Must be publicly accessible
   - Leave empty to use default

#### Operation Mode:

5. **Test Mode / Live Mode**
   - **Test Mode (Sandbox)**: For testing payments (no real money)
   - **Live Mode (Production)**: For real payments
   - Toggle between modes using the buttons

### Step 4: Save Configuration

1. Click **"Simpan Perubahan"** (Save Changes) button
2. Wait for success message: "Tetapan ToyyibPay berjaya disimpan!"

### Step 5: Test Connection

1. Click **"Uji Sambungan"** (Test Connection) button
2. The system will:
   - Save your settings
   - Verify the configuration
   - Test connection to ToyyibPay API
3. You should see:
   - ✅ Green success message if connection works
   - ❌ Red error message if there's an issue

## Configuration Details

### Test Mode vs Live Mode

- **Test Mode**: 
  - Uses `https://dev.toyyibpay.com`
  - No real payments processed
  - Use for development and testing
  
- **Live Mode**:
  - Uses `https://toyyibpay.com`
  - Real payments processed
  - Use for production

### URLs Configuration

#### Return URL
- Where users are redirected after completing payment
- Format: `https://yourdomain.com/payment/return`
- This page shows payment status to the user

#### Callback URL
- Where ToyyibPay sends payment status updates (webhook)
- Format: `https://yourdomain.com/api/toyyibpay/callback`
- **Important**: Must be publicly accessible
- Used to automatically update payment status in your system

## Using ToyyibPay for Payments

Once configured, ToyyibPay can be used for:

### 1. Fee Payments (Yuran)

1. Navigate to **Yuran** (Fees) page
2. Find the fee record you want to pay
3. Click **"Bayar"** (Pay) button
4. Select **"ToyyibPay"** as payment method
5. You'll be redirected to ToyyibPay payment page
6. Complete payment using your preferred method (FPX, Card, DuitNow, E-Wallet)
7. After payment, you'll be redirected back to your app

### 2. Payment Flow

```
User clicks "Pay" 
  → System creates payment intent
  → Redirects to ToyyibPay payment page
  → User completes payment
  → ToyyibPay redirects back (Return URL)
  → ToyyibPay sends webhook (Callback URL)
  → System updates payment status automatically
```

## Troubleshooting

### Issue: "ToyyibPay configuration is missing"

**Solution**: 
- Make sure you've entered both Secret Key and Category Code
- Click "Simpan Perubahan" to save
- Try testing connection again

### Issue: "Failed to create ToyyibPay bill"

**Possible Causes**:
1. Invalid Secret Key or Category Code
2. Network connectivity issues
3. ToyyibPay API is down

**Solutions**:
- Verify your credentials in ToyyibPay dashboard
- Check your internet connection
- Try again after a few minutes
- Contact ToyyibPay support if issue persists

### Issue: Payment status not updating

**Possible Causes**:
1. Callback URL not accessible
2. Webhook not received

**Solutions**:
- Verify callback URL is publicly accessible
- Check backend logs for webhook errors
- Manually check payment status using the status endpoint

### Issue: "Access denied" when accessing settings

**Solution**:
- Make sure you're logged in as an **Admin** user
- Check your user role in the system

## Security Best Practices

1. **Never share your Secret Key** with anyone
2. **Keep your Secret Key secure** - it's like a password
3. **Use Test Mode** during development
4. **Switch to Live Mode** only when ready for production
5. **Monitor payment logs** regularly
6. **Use HTTPS** for all URLs (Return URL and Callback URL)

## API Endpoints

The system provides these ToyyibPay endpoints:

- `POST /api/toyyibpay/initiate` - Create a new payment
- `POST /api/toyyibpay/callback` - Webhook endpoint (no auth required)
- `GET /api/toyyibpay/status/:paymentId` - Check payment status
- `GET /api/toyyibpay/config` - Get configuration (admin only)

## Support

If you encounter issues:

1. Check this guide first
2. Review error messages in the settings page
3. Check backend logs for detailed errors
4. Contact ToyyibPay support: https://toyyibpay.com/contact
5. Check system logs in admin panel

## Next Steps

After setup:

1. ✅ Test with a small amount in Test Mode
2. ✅ Verify payment appears in your system
3. ✅ Check that fee status updates automatically
4. ✅ Test Return URL redirect
5. ✅ Verify Callback URL receives webhooks
6. ✅ Switch to Live Mode when ready
7. ✅ Monitor first few real payments

## Additional Resources

- [ToyyibPay Documentation](https://toyyibpay.com/docs)
- [ToyyibPay Dashboard](https://toyyibpay.com/dashboard)
- [ToyyibPay Support](https://toyyibpay.com/contact)

---

**Note**: This integration is fully automated. Once configured, payments will be processed automatically and fee records will be updated in real-time.

