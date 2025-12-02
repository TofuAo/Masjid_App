# ToyyibPay Integration Guide

## Overview

This application now uses **ToyyibPay** as the exclusive payment gateway. ToyyibPay is a Shariah-compliant payment platform that supports:
- FPX (Online Banking)
- Credit/Debit Cards
- DuitNow QR
- E-Wallets (Touch 'n Go, Boost, GrabPay)

## Architecture

### Backend Components

1. **Service Layer** (`backend/services/toyyibpayService.js`)
   - `createToyyibPayBill()` - Creates payment bills in ToyyibPay
   - `getBillStatus()` - Checks payment status from ToyyibPay
   - `parseCallbackData()` - Parses webhook data from ToyyibPay
   - `updatePaymentAfterCallback()` - Updates payment and fee records after payment
   - `getToyyibPayConfig()` - Retrieves configuration from database or environment

2. **Controller Layer** (`backend/controllers/toyyibPayController.js`)
   - `initiateToyyibPayPayment()` - Creates payment intent and ToyyibPay bill
   - `toyibPayCallback()` - Handles webhook callbacks from ToyyibPay
   - `checkPaymentStatus()` - Manually checks payment status
   - `getToyyibPayConfigEndpoint()` - Returns configuration (admin only)

3. **Routes** (`backend/routes/toyyibpay.js`)
   - `POST /api/toyyibpay/initiate` - Initiate payment (authenticated)
   - `POST /api/toyyibpay/callback` - Webhook endpoint (public, no auth)
   - `GET /api/toyyibpay/status/:paymentId` - Check payment status
   - `GET /api/toyyibpay/config` - Get configuration (admin only)

### Frontend Components

1. **PaymentCheckout** (`src/pages/PaymentCheckout.jsx`)
   - Payment form that collects customer information
   - Initiates ToyyibPay payment
   - Redirects to ToyyibPay payment page

2. **PaymentReturn** (`src/pages/PaymentReturn.jsx`)
   - Handles redirects from ToyyibPay after payment
   - Shows payment status (success/failed/pending)
   - Allows users to return to fees page

3. **ToyyibPaySettings** (`src/pages/ToyyibPaySettings.jsx`)
   - Admin-only page for configuring ToyyibPay
   - Allows setting Secret Key, Category Code, Test/Live mode
   - Configures Return URL and Callback URL

## Configuration

### Admin Configuration (Recommended)

1. Navigate to **Tetapan ToyyibPay** in the admin menu
2. Enter your ToyyibPay credentials:
   - **Secret Key**: From your ToyyibPay dashboard
   - **Category Code**: From your ToyyibPay dashboard
   - **Test Mode**: Enable for testing, disable for production
   - **Return URL**: Where users are redirected after payment
   - **Callback URL**: Webhook endpoint for payment status updates

### Environment Variables (Fallback)

If admin settings are not configured, the system falls back to environment variables:

```env
TOYYIBPAY_SECRET_KEY=your_secret_key
TOYYIBPAY_CATEGORY_CODE=your_category_code
TOYYIBPAY_RETURN_URL=https://yourdomain.com/payment/return
TOYYIBPAY_CALLBACK_URL=https://yourdomain.com/api/toyyibpay/callback
TOYYIBPAY_TEST_MODE=true  # Set to false for production
```

## Payment Flow

### 1. Payment Initiation

```javascript
// Frontend calls:
POST /api/toyyibpay/initiate
{
  "amount": 100.50,
  "description": "Yuran Januari 2025 - Ahmad",
  "customerName": "Ahmad",
  "customerEmail": "ahmad@example.com",
  "customerPhone": "0123456789",
  "feeId": 123  // Optional: Link to fee record
}

// Response:
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "billCode": "abc123",
    "paymentUrl": "https://toyyibpay.com/abc123",
    "amount": 100.50
  }
}
```

### 2. User Payment

- User is redirected to `paymentUrl`
- User completes payment on ToyyibPay platform
- ToyyibPay processes payment via FPX/Card/DuitNow/E-Wallet

### 3. Payment Completion

**Webhook (Backend):**
- ToyyibPay sends callback to `/api/toyyibpay/callback`
- System updates payment status in database
- If payment is for a fee (`feeId` provided), fee status is updated to "terbayar"

**Return (Frontend):**
- User is redirected to `/payment/return`
- Page shows payment status
- User can return to fees page

## Linking Payments to Fees

When initiating a payment for a fee (yuran), include the `feeId`:

```javascript
POST /api/toyyibpay/initiate
{
  "amount": 150.00,
  "description": "Yuran Januari 2025",
  "feeId": 123  // Links payment to fee record
}
```

When payment is completed:
1. Payment record is updated with status "completed"
2. Fee record is automatically updated:
   - Status: "terbayar"
   - Payment date: Current date
   - Payment method: "ToyyibPay"
   - Receipt number: Transaction ID from ToyyibPay

## Webhook Security

The webhook endpoint (`/api/toyyibpay/callback`) is publicly accessible but secure because:
1. It verifies the bill code exists in the database
2. It only updates existing payment records
3. It returns "OK" even for invalid requests to prevent retries

## Testing

### Test Mode

1. Enable Test Mode in ToyyibPay Settings
2. Use test credentials from ToyyibPay sandbox
3. Test payments will not process real money

### Production Mode

1. Disable Test Mode in ToyyibPay Settings
2. Use production credentials from ToyyibPay
3. Ensure Return URL and Callback URL are publicly accessible
4. All payments will process real money

## Troubleshooting

### Payment Not Updating

1. Check webhook is accessible: `https://yourdomain.com/api/toyyibpay/callback`
2. Verify callback URL in ToyyibPay dashboard matches your server
3. Check server logs for webhook errors
4. Manually check payment status using `/api/toyyibpay/status/:paymentId`

### Configuration Issues

1. Verify Secret Key and Category Code are correct
2. Ensure Test Mode matches your ToyyibPay account type
3. Check Return URL and Callback URL are valid and accessible

### Payment Status Not Syncing

1. Webhook may have failed - check payment status manually
2. Use `/api/toyyibpay/status/:paymentId` to force status check
3. Verify database connection is working

## API Reference

### Initiate Payment

```http
POST /api/toyyibpay/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.50,
  "description": "Payment description",
  "customerName": "Customer Name",
  "customerEmail": "customer@example.com",
  "customerPhone": "0123456789",
  "feeId": 123  // Optional
}
```

### Check Payment Status

```http
GET /api/toyyibpay/status/:paymentId
Authorization: Bearer <token>
```

### Get Configuration (Admin)

```http
GET /api/toyyibpay/config
Authorization: Bearer <admin_token>
```

## Migration Notes

### Replaced Components

- Old payment gateway service (`paymentGatewayService.js`) - Still exists but not used
- Old payment controller methods - Replaced with ToyyibPay-specific methods
- Multiple gateway support - Now only ToyyibPay

### Database

- Payment records stored in `payments` table
- Payment gateway settings in `payment_gateway_settings` table
- Fee records linked via `metadata.feeId` in payment record

## Support

For ToyyibPay support:
- Website: https://toyyibpay.com
- Documentation: Check ToyyibPay developer portal
- Support: Contact ToyyibPay support team

For application support:
- Check server logs for errors
- Review webhook logs in ToyyibPay dashboard
- Verify configuration in admin settings

