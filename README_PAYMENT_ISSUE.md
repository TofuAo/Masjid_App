# 🔧 Dashboard Payment Issue - Simple Fix Guide

## ❓ What's Wrong?

Your dashboard shows **"RM 0.00"** for "Kutipan Yuran" (Fee Collection) even though 1 user has already paid.

## 🔍 Why is This Happening?

1. ✅ **Payments exist in database** - 6 ToyyibPay payments found
2. ❌ **All stuck in 'processing' status** - Should be 'completed'
3. ❌ **Webhooks not working** - ToyyibPay isn't updating your system
4. ❌ **Dashboard shows RM 0.00** - Only counts 'completed' payments

## 📊 Found 6 Stuck Payments:

| Bill Code | Amount | User | Date | Fee ID |
|-----------|--------|------|------|--------|
| 8qfk4ha7 | RM 1.50 | Ahmad Zulkifli | Dec 9 | 7314 |
| ufyaujtt | RM 1.50 | Ahmad Zulkifli | Dec 8 | 7314 |
| h0v2b32m | RM 1.50 | Ahmad Zulkifli | Dec 8 | 7314 |
| 6svje3x6 | RM 0.98 | Ahmad Zulkifli | Dec 8 | 7314 |
| dc05k789 | RM 150.00 | Ahmad Zulkifli | Dec 8 | 3672 |
| 03qqwt0x | RM 150.00 | Ahmad Zulkifli | Dec 8 | 3672 |

**Total:** RM 305.48

## ✅ SOLUTION: 3 Simple Steps

### Step 1: Check ToyyibPay Dashboard

1. Login to **https://toyyibpay.com**
2. Go to **Transactions** or **Bills**
3. Search for these bill codes:
   - `8qfk4ha7`
   - `ufyaujtt`
   - `h0v2b32m`
   - `6svje3x6`
   - `dc05k789`
   - `03qqwt0x`

4. **Check which ones show as "Paid" or "Success"**
   - Write down the bill codes that are actually paid

### Step 2: Update the Paid Payments

**For each CONFIRMED paid bill code**, run this command:

```powershell
# Example for bill code 03qqwt0x (RM 150):
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "UPDATE payments SET status='completed', webhook_received=1 WHERE provider_reference='03qqwt0x'; UPDATE fees SET status='terbayar', cara_bayar='ToyyibPay', tarikh_bayar=CURRENT_DATE WHERE id=3672;"
```

**Replace:**
- `03qqwt0x` with the actual bill code
- `3672` with the fee ID from the table above

**Or update ALL at once (if all are confirmed paid):**

```powershell
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "UPDATE payments SET status='completed', webhook_received=1 WHERE status='processing' AND provider='toyyibpay';"
```

### Step 3: Refresh Dashboard

1. Go to your dashboard page
2. Press **Ctrl+F5** (hard refresh)
3. Check "Kutipan Yuran" - should show the correct amount now!

## 🔄 How Payment Confirmation Works

### Normal Flow (When Working):

```
User pays → ToyyibPay processes → Webhook sent → Database updated → Dashboard shows amount ✅
```

### Current Flow (Broken):

```
User pays → ToyyibPay processes → Webhook FAILS → Database NOT updated → Dashboard shows RM 0.00 ❌
```

## 🛠️ Fix Webhook (Prevent Future Issues)

### Check Webhook Configuration:

1. Go to ToyyibPay Dashboard → Settings → Webhook
2. **Callback URL should be:**
   ```
   https://your-domain.com/api/webhook/payment
   ```

3. **Common issues:**
   - ❌ URL not accessible from internet
   - ❌ Wrong URL in ToyyibPay settings
   - ❌ Firewall blocking webhooks
   - ❌ SSL certificate problems

### Test Webhook:

```powershell
# Check if webhook endpoint is accessible
curl -X POST http://localhost:5000/api/webhook/payment

# Should return: 200 or error message (not timeout)
```

## 📝 Quick Reference Commands

### Check Current Status:
```powershell
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT provider_reference, amount, status FROM payments WHERE status='processing' AND provider='toyyibpay';"
```

### Check Dashboard Amount:
```powershell
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT COUNT(*) as fees, SUM(jumlah) as total FROM fees WHERE status IN ('Bayar', 'terbayar') AND MONTH(tarikh_bayar)=MONTH(CURRENT_DATE) AND YEAR(tarikh_bayar)=YEAR(CURRENT_DATE);"
```

### View Backend Logs:
```powershell
docker-compose logs backend --tail 50 | Select-String "payment"
```

## ⚠️ Important Warnings

1. **ONLY update payments that are CONFIRMED paid on ToyyibPay**
2. **Don't update if payment shows 'failed' or 'pending' on ToyyibPay**
3. **Backup database first** (optional but recommended):
   ```powershell
   docker-compose exec mysql mysqldump -umasjid_user -pmasjid_password masjid_app > backup.sql
   ```

## 🎉 Expected Result

After fixing:
- ✅ Dashboard shows **RM 305.48** (or actual confirmed amount)
- ✅ Payments marked as 'completed'
- ✅ Fees marked as 'terbayar' (paid)
- ✅ Receipts automatically generated
- ✅ Future payments work automatically (after webhook fix)

## 📞 Still Not Working?

1. **Check ToyyibPay logs** - Login to ToyyibPay and check transaction history
2. **Check backend logs** - `docker-compose logs backend`
3. **Test webhook URL** - Make sure it's accessible from internet
4. **Contact ToyyibPay support** - If webhook issues persist

## 📚 Additional Documentation

- `PAYMENT_CONFIRMATION_GUIDE.md` - Detailed technical guide
- `DASHBOARD_FIX_SUMMARY.md` - Complete issue analysis
- `UPDATE_STUCK_PAYMENTS.sql` - SQL scripts for manual updates

---

**Quick Action:**
1. ✅ Check ToyyibPay dashboard for paid bills
2. ✅ Run update commands for confirmed payments
3. ✅ Refresh dashboard
4. ✅ Fix webhook configuration

**Time needed:** 5-10 minutes
