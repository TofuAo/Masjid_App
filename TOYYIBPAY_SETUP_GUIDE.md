2025-12-02T03:17:52.103Z	Initializing build environment...
2025-12-02T03:17:52.103Z	Initializing build environment...
2025-12-02T03:18:20.643Z	Success: Finished initializing build environment
2025-12-02T03:18:21.185Z	Cloning repository...
2025-12-02T03:18:22.693Z	Detected the following tools from environment: npm@10.9.2, nodejs@22.16.0
2025-12-02T03:18:22.694Z	Restoring from dependencies cache
2025-12-02T03:18:22.696Z	Restoring from build output cache
2025-12-02T03:18:23.112Z	Installing project dependencies: npm clean-install --progress=false
2025-12-02T03:18:27.712Z	npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
2025-12-02T03:18:30.449Z	
2025-12-02T03:18:30.449Z	added 326 packages, and audited 327 packages in 7s
2025-12-02T03:18:30.450Z	
2025-12-02T03:18:30.450Z	72 packages are looking for funding
2025-12-02T03:18:30.450Z	  run `npm fund` for details
2025-12-02T03:18:30.454Z	
2025-12-02T03:18:30.454Z	4 vulnerabilities (2 moderate, 2 high)
2025-12-02T03:18:30.454Z	
2025-12-02T03:18:30.455Z	To address issues that do not require attention, run:
2025-12-02T03:18:30.455Z	  npm audit fix
2025-12-02T03:18:30.455Z	
2025-12-02T03:18:30.455Z	Some issues need review, and may require choosing
2025-12-02T03:18:30.455Z	a different dependency.
2025-12-02T03:18:30.455Z	
2025-12-02T03:18:30.455Z	Run `npm audit` for details.
2025-12-02T03:18:30.698Z	Executing user build command: npm run build
2025-12-02T03:18:31.066Z	
2025-12-02T03:18:31.067Z	> mymasjidapp@0.0.0 build
2025-12-02T03:18:31.067Z	> vite build
2025-12-02T03:18:31.067Z	
2025-12-02T03:18:31.682Z	[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
2025-12-02T03:18:31.942Z	vite v7.1.7 building for production...
2025-12-02T03:18:32.050Z	transforming...
2025-12-02T03:18:39.633Z	✓ 1835 modules transformed.
2025-12-02T03:18:40.315Z	rendering chunks...
2025-12-02T03:18:40.749Z	computing gzip size...
2025-12-02T03:18:40.803Z	dist/index.html                     0.51 kB │ gzip:   0.33 kB
2025-12-02T03:18:40.803Z	dist/assets/index-CZ4c4fXT.css     86.87 kB │ gzip:  14.36 kB
2025-12-02T03:18:40.804Z	dist/assets/xlsx-DGuHH-KN.js      429.49 kB │ gzip: 143.07 kB
2025-12-02T03:18:40.806Z	dist/assets/index-i-MELZE2.js   1,315.41 kB │ gzip: 335.22 kB
2025-12-02T03:18:40.807Z	✓ built in 8.80s
2025-12-02T03:18:40.807Z	
2025-12-02T03:18:40.807Z	(!) Some chunks are larger than 500 kB after minification. Consider:
2025-12-02T03:18:40.808Z	- Using dynamic import() to code-split the application
2025-12-02T03:18:40.811Z	- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
2025-12-02T03:18:40.811Z	- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
2025-12-02T03:18:40.950Z	Success: Build command completed
2025-12-02T03:18:41.154Z	Executing user deploy command: npx wrangler deploy
2025-12-02T03:18:42.662Z	npm warn exec The following package was not found and will be installed: wrangler@4.51.0
2025-12-02T03:18:57.369Z	
2025-12-02T03:18:57.369Z	 ⛅️ wrangler 4.51.0
2025-12-02T03:18:57.369Z	───────────────────
2025-12-02T03:18:57.483Z	▲ [WARNING] Failed to match Worker name. Your config file is using the Worker name "mymasjidapp", but the CI system expected "e-quran". Overriding using the CI provided Worker name. Workers Builds connected builds will attempt to open a pull request to resolve this config name mismatch.
2025-12-02T03:18:57.483Z	
2025-12-02T03:18:57.483Z	
2025-12-02T03:18:58.304Z	🌀 Building list of assets...
2025-12-02T03:18:58.304Z	✨ Read 8 files from the assets directory /opt/buildhome/repo/dist
2025-12-02T03:18:58.329Z	🌀 Starting asset upload...
2025-12-02T03:19:00.092Z	No updated asset files to upload. Proceeding with deployment...
2025-12-02T03:19:00.093Z	Total Upload: 0.33 KiB / gzip: 0.24 KiB
2025-12-02T03:19:00.825Z	
2025-12-02T03:19:00.827Z	✘ [ERROR] A request to the Cloudflare API (/accounts/3bed1d313d18b06bc3f09e2834a503a2/workers/scripts/e-quran/versions) failed.
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	  Invalid _redirects configuration:
2025-12-02T03:19:00.827Z	  Line 1: Infinite loop detected in this rule. This would cause a redirect to strip `.html` or `/index` and end up triggering this rule again. [code: 10021]
2025-12-02T03:19:00.827Z	  To learn more about this error, visit: https://developers.cloudflare.com/workers/observability/errors/#validation-errors-10021
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	  
2025-12-02T03:19:00.827Z	  If you think this is a bug, please open an issue at: https://github.com/cloudflare/workers-sdk/issues/new/choose
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.828Z	
2025-12-02T03:19:00.828Z	Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
2025-12-02T03:19:00.843Z	🪵  Logs were written to "/opt/buildhome/.config/.wrangler/logs/wrangler-2025-12-02_03-18-56_582.log"
2025-12-02T03:19:01.697Z	Failed: error occurred while running deploy command2025-12-02T03:17:52.103Z	Initializing build environment...
2025-12-02T03:17:52.103Z	Initializing build environment...
2025-12-02T03:18:20.643Z	Success: Finished initializing build environment
2025-12-02T03:18:21.185Z	Cloning repository...
2025-12-02T03:18:22.693Z	Detected the following tools from environment: npm@10.9.2, nodejs@22.16.0
2025-12-02T03:18:22.694Z	Restoring from dependencies cache
2025-12-02T03:18:22.696Z	Restoring from build output cache
2025-12-02T03:18:23.112Z	Installing project dependencies: npm clean-install --progress=false
2025-12-02T03:18:27.712Z	npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
2025-12-02T03:18:30.449Z	
2025-12-02T03:18:30.449Z	added 326 packages, and audited 327 packages in 7s
2025-12-02T03:18:30.450Z	
2025-12-02T03:18:30.450Z	72 packages are looking for funding
2025-12-02T03:18:30.450Z	  run `npm fund` for details
2025-12-02T03:18:30.454Z	
2025-12-02T03:18:30.454Z	4 vulnerabilities (2 moderate, 2 high)
2025-12-02T03:18:30.454Z	
2025-12-02T03:18:30.455Z	To address issues that do not require attention, run:
2025-12-02T03:18:30.455Z	  npm audit fix
2025-12-02T03:18:30.455Z	
2025-12-02T03:18:30.455Z	Some issues need review, and may require choosing
2025-12-02T03:18:30.455Z	a different dependency.
2025-12-02T03:18:30.455Z	
2025-12-02T03:18:30.455Z	Run `npm audit` for details.
2025-12-02T03:18:30.698Z	Executing user build command: npm run build
2025-12-02T03:18:31.066Z	
2025-12-02T03:18:31.067Z	> mymasjidapp@0.0.0 build
2025-12-02T03:18:31.067Z	> vite build
2025-12-02T03:18:31.067Z	
2025-12-02T03:18:31.682Z	[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
2025-12-02T03:18:31.942Z	vite v7.1.7 building for production...
2025-12-02T03:18:32.050Z	transforming...
2025-12-02T03:18:39.633Z	✓ 1835 modules transformed.
2025-12-02T03:18:40.315Z	rendering chunks...
2025-12-02T03:18:40.749Z	computing gzip size...
2025-12-02T03:18:40.803Z	dist/index.html                     0.51 kB │ gzip:   0.33 kB
2025-12-02T03:18:40.803Z	dist/assets/index-CZ4c4fXT.css     86.87 kB │ gzip:  14.36 kB
2025-12-02T03:18:40.804Z	dist/assets/xlsx-DGuHH-KN.js      429.49 kB │ gzip: 143.07 kB
2025-12-02T03:18:40.806Z	dist/assets/index-i-MELZE2.js   1,315.41 kB │ gzip: 335.22 kB
2025-12-02T03:18:40.807Z	✓ built in 8.80s
2025-12-02T03:18:40.807Z	
2025-12-02T03:18:40.807Z	(!) Some chunks are larger than 500 kB after minification. Consider:
2025-12-02T03:18:40.808Z	- Using dynamic import() to code-split the application
2025-12-02T03:18:40.811Z	- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
2025-12-02T03:18:40.811Z	- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
2025-12-02T03:18:40.950Z	Success: Build command completed
2025-12-02T03:18:41.154Z	Executing user deploy command: npx wrangler deploy
2025-12-02T03:18:42.662Z	npm warn exec The following package was not found and will be installed: wrangler@4.51.0
2025-12-02T03:18:57.369Z	
2025-12-02T03:18:57.369Z	 ⛅️ wrangler 4.51.0
2025-12-02T03:18:57.369Z	───────────────────
2025-12-02T03:18:57.483Z	▲ [WARNING] Failed to match Worker name. Your config file is using the Worker name "mymasjidapp", but the CI system expected "e-quran". Overriding using the CI provided Worker name. Workers Builds connected builds will attempt to open a pull request to resolve this config name mismatch.
2025-12-02T03:18:57.483Z	
2025-12-02T03:18:57.483Z	
2025-12-02T03:18:58.304Z	🌀 Building list of assets...
2025-12-02T03:18:58.304Z	✨ Read 8 files from the assets directory /opt/buildhome/repo/dist
2025-12-02T03:18:58.329Z	🌀 Starting asset upload...
2025-12-02T03:19:00.092Z	No updated asset files to upload. Proceeding with deployment...
2025-12-02T03:19:00.093Z	Total Upload: 0.33 KiB / gzip: 0.24 KiB
2025-12-02T03:19:00.825Z	
2025-12-02T03:19:00.827Z	✘ [ERROR] A request to the Cloudflare API (/accounts/3bed1d313d18b06bc3f09e2834a503a2/workers/scripts/e-quran/versions) failed.
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	  Invalid _redirects configuration:
2025-12-02T03:19:00.827Z	  Line 1: Infinite loop detected in this rule. This would cause a redirect to strip `.html` or `/index` and end up triggering this rule again. [code: 10021]
2025-12-02T03:19:00.827Z	  To learn more about this error, visit: https://developers.cloudflare.com/workers/observability/errors/#validation-errors-10021
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	  
2025-12-02T03:19:00.827Z	  If you think this is a bug, please open an issue at: https://github.com/cloudflare/workers-sdk/issues/new/choose
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.827Z	
2025-12-02T03:19:00.828Z	
2025-12-02T03:19:00.828Z	Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
2025-12-02T03:19:00.843Z	🪵  Logs were written to "/opt/buildhome/.config/.wrangler/logs/wrangler-2025-12-02_03-18-56_582.log"
2025-12-02T03:19:01.697Z	Failed: error occurred while running deploy command# ToyyibPay Setup Guide

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

