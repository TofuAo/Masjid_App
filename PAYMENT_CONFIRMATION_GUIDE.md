# Payment Confirmation Guide - ToyyibPay Integration

## 📊 Current Status

### Issues Found:
1. ✅ **Database has 5,117 paid fees** totaling **RM 767,550** (all from previous months)
2. ⚠️ **Dashboard shows RM 0.00** because it only shows **current month** (December 2025) payments
3. ⚠️ **ToyyibPay payments stuck in 'processing' status** - webhooks not updating payment status

### Payment Records in Database:
```
Payment ID: 09c6b904-dfc7-4fcc-8c2b-554c101fbb96
- Amount: RM 150.00
- Status: processing (should be 'completed')
- Bill Code: 03qqwt0x
- User: 051003-06-0229 (Ahmad Zulkifli)
- Date: 2025-12-08

Payment ID: 32d9cc75-87b7-4cf6-9a16-22b2f8acbe84
- Amount: RM 1.50
- Status: processing (should be 'completed')
- Bill Code: h0v2b32m
- User: 051003-06-0229 (Ahmad Zulkifli)
- Date: 2025-12-08
```

---

## 🔄 How ToyyibPay Payment Confirmation Works

### Payment Flow:

```
1. USER INITIATES PAYMENT
   └─> Frontend: Click "Bayar Online"
   └─> Backend: POST /api/fees/:id/pay-online
   └─> Creates payment record (status: 'pending')
   └─> Calls ToyyibPay API to create bill
   └─> Gets billCode and paymentUrl
   └─> Redirects user to ToyyibPay payment page

2. USER COMPLETES PAYMENT ON TOYYIBPAY
   └─> ToyyibPay processes payment (FPX/Card/E-Wallet)
   └─> Payment successful/failed

3. TOYYIBPAY SENDS WEBHOOK (Automatic)
   └─> POST /api/webhook/payment
   └─> Backend receives payment status
   └─> Updates payment record:
       - Status: 'completed' or 'failed'
       - Updates fee status to 'terbayar'
       - Generates receipt
       - Updates provider_reference

4. USER RETURNS TO APP
   └─> ToyyibPay redirects to return URL
   └─> Frontend shows payment success/failure
```

---

## ✅ How to Confirm ToyyibPay Payments

### Method 1: Manual Check via ToyyibPay Dashboard

1. **Login to ToyyibPay Account**
   - Go to: https://toyyibpay.com
   - Login with your merchant account

2. **Check Payment Status**
   - Navigate to "Transactions" or "Bills"
   - Search for bill codes:
     - `03qqwt0x`
     - `h0v2b32m`
   - Check if payment was completed

3. **If Payment Completed on ToyyibPay:**
   - Payment status: Paid/Success
   - Invoice Number: xxxxx
   - Payment Date: xxxxx

### Method 2: Check Payment Status via API (Automatic)

The system can automatically check payment status:

```javascript
// backend/services/toyyibpayService.js has this function:
export async function getBillStatus(billCode) {
  // This checks ToyyibPay for payment status
  // Returns: { status, amount, paidAt, transactionId }
}
```

### Method 3: Trigger Webhook Manually (If webhook failed)

Sometimes webhooks fail due to:
- Network issues
- Server downtime
- Firewall blocking

You can manually trigger payment confirmation.

---

## 🛠️ Fix Current Stuck Payments

### Option A: Update via Database (Quick Fix)

If you've confirmed payment on ToyyibPay dashboard:

```sql
-- Update specific payment to completed
UPDATE payments 
SET status = 'completed',
    webhook_received = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '09c6b904-dfc7-4fcc-8c2b-554c101fbb96';

-- Update the related fee to paid
UPDATE fees 
SET status = 'terbayar',
    cara_bayar = 'ToyyibPay',
    tarikh_bayar = CURRENT_DATE
WHERE id = 3672;
```

### Option B: Use Built-in Payment Reconciliation

The system has automated payment reconciliation:

```javascript
// backend/schedulers/paymentReconciliationJob.js
// Runs automatically to check stuck payments
```

This job:
1. Finds payments stuck in 'processing' > 24 hours
2. Checks ToyyibPay API for actual status
3. Updates database accordingly

### Option C: Admin Manual Confirmation (Recommended)

For payments with proof/receipts, admins can manually confirm:

1. Go to Admin Dashboard → Fees/Payments
2. Find the payment record
3. Click "Confirm Payment"
4. Upload receipt (optional)
5. Click "Approve"

---

## 📱 How to Test ToyyibPay Integration

### Test Payment Flow:

```bash
# 1. Create a test payment
curl -X POST http://localhost:5000/api/fees/3672/pay-online \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response should include:
# - paymentUrl: https://toyyibpay.com/billcode
# - billCode: xxxxx
# - paymentId: uuid

# 2. Visit the paymentUrl and complete payment

# 3. Check webhook endpoint is accessible
curl http://localhost:5000/api/webhook/payment

# 4. Manually trigger webhook (for testing)
curl -X POST http://localhost:5000/api/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "toyyibpay",
    "paymentId": "YOUR_PAYMENT_ID",
    "status": "completed",
    "amount": 150.00,
    "billCode": "xxxxx",
    "providerReference": "INV123"
  }'
```

---

## 🔧 Dashboard Data Explanation

### "Kutipan Yuran" Card:

**Current Code:**
```javascript
// In Laporan.jsx or similar
totalYuran: reportData.overview.totalYuran || 0
```

**What it shows:**
- Total fees collected in the **current month** only
- Filters by `tarikh_bayar` (payment date) in current month
- Only counts fees with status: 'terbayar' or 'Bayar'

**Why it's RM 0.00:**
- No fees were marked as 'terbayar' in December 2025 yet
- The payments exist but are stuck in 'processing'
- Once payments are confirmed, this will update

**To fix the display:**

```sql
-- Check current month paid fees
SELECT 
  COUNT(*) as total_fees,
  SUM(jumlah) as total_amount
FROM fees 
WHERE status IN ('Bayar', 'terbayar')
  AND MONTH(tarikh_bayar) = MONTH(CURRENT_DATE)
  AND YEAR(tarikh_bayar) = YEAR(CURRENT_DATE);
```

---

## 🚀 Recommended Actions

### Immediate Steps:

1. **Check ToyyibPay Dashboard** for payment status of:
   - Bill Code: `03qqwt0x` (RM 150.00)
   - Bill Code: `h0v2b32m` (RM 1.50)

2. **If Payments are Completed on ToyyibPay:**
   ```bash
   # Run this SQL to update
   docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app
   ```
   
   Then execute the SQL from Option A above

3. **Verify Webhook Configuration:**
   - Check ToyyibPay webhook URL is set to: `https://your-domain.com/api/webhook/payment`
   - Ensure server is accessible from external networks
   - Check firewall allows POST requests

4. **Enable Payment Reconciliation:**
   - The system already has automated reconciliation
   - It runs daily to check stuck payments
   - Manual trigger: Restart backend to force immediate check

### Long-term Solutions:

1. **Monitor Webhook Logs:**
   ```bash
   # Check backend logs for webhook activity
   docker-compose logs backend | grep "webhook"
   docker-compose logs backend | grep "payment"
   ```

2. **Set up Webhook Endpoint Monitoring:**
   - Use services like Webhook.site to test
   - Ensure your domain is accessible
   - Check SSL certificate is valid

3. **Add Manual Reconciliation Button:**
   - Add button in admin panel
   - Allows admins to force-check payment status
   - Useful for stuck payments

---

## 📊 Database Schema Reference

### Fees Table:
```sql
status ENUM('Bayar', 'Belum Bayar', 'terbayar', 'tunggak', 'pending')
- 'terbayar' = Paid/Completed
- 'Bayar' = Paid (legacy)
- 'Belum Bayar' = Unpaid
- 'tunggak' = Overdue
```

### Payments Table:
```sql
status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired')
- 'pending' = Payment initiated, not yet paid
- 'processing' = Waiting for confirmation
- 'completed' = Payment successful
- 'failed' = Payment failed
```

---

## 🎯 Summary

**Current Issue:**
- Dashboard shows RM 0.00 because there are no COMPLETED payments in current month
- 2 ToyyibPay payments are stuck in 'processing' status
- Webhooks may not be working properly

**Solution:**
1. Check ToyyibPay dashboard for actual payment status
2. Manually update database if payments are completed
3. Fix webhook configuration for future payments
4. Enable automated reconciliation

**Next Steps:**
1. I'll create a script to check and update these specific payments
2. I'll create an admin interface to manually reconcile payments
3. We'll test the webhook endpoint

