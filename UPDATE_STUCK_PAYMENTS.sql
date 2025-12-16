-- ============================================
-- Update Stuck ToyyibPay Payments
-- ============================================
-- This script updates payments that are stuck in 'processing' status
-- Run this ONLY after confirming the payments are completed on ToyyibPay dashboard

-- Step 1: Check current status of processing payments
SELECT 
    p.id,
    p.user_ic,
    p.amount,
    p.provider_reference as bill_code,
    p.status,
    p.created_at,
    JSON_EXTRACT(p.metadata, '$.feeId') as fee_id,
    JSON_EXTRACT(p.metadata, '$.description') as description
FROM payments p
WHERE p.status = 'processing'
  AND p.provider = 'toyyibpay'
ORDER BY p.created_at DESC;

-- Step 2: Check related fees status
SELECT 
    f.id,
    f.student_ic,
    f.bulan,
    f.tahun,
    f.jumlah,
    f.status,
    f.tarikh_bayar
FROM fees f
WHERE f.id IN (
    SELECT JSON_EXTRACT(metadata, '$.feeId')
    FROM payments
    WHERE status = 'processing'
      AND provider = 'toyyibpay'
);

-- ============================================
-- IMPORTANT: Only run the UPDATE statements below
-- AFTER confirming the payments are successful on ToyyibPay
-- ============================================

-- Step 3: Update Payment 1 (Bill Code: 03qqwt0x - RM 150.00)
-- Uncomment the lines below ONLY if payment is confirmed on ToyyibPay
/*
UPDATE payments 
SET status = 'completed',
    webhook_received = 1,
    webhook_data = JSON_OBJECT(
        'status', 'completed',
        'confirmedAt', NOW(),
        'confirmedBy', 'manual',
        'billCode', '03qqwt0x'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE id = '09c6b904-dfc7-4fcc-8c2b-554c101fbb96'
  AND status = 'processing';

-- Update the related fee
UPDATE fees 
SET status = 'terbayar',
    cara_bayar = 'ToyyibPay',
    tarikh_bayar = CURRENT_DATE
WHERE id = 3672
  AND status != 'terbayar';
*/

-- Step 4: Update Payment 2 (Bill Code: h0v2b32m - RM 1.50)
-- Uncomment the lines below ONLY if payment is confirmed on ToyyibPay
/*
UPDATE payments 
SET status = 'completed',
    webhook_received = 1,
    webhook_data = JSON_OBJECT(
        'status', 'completed',
        'confirmedAt', NOW(),
        'confirmedBy', 'manual',
        'billCode', 'h0v2b32m'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE id = '32d9cc75-87b7-4cf6-9a16-22b2f8acbe84'
  AND status = 'processing';

-- Update the related fee
UPDATE fees 
SET status = 'terbayar',
    cara_bayar = 'ToyyibPay',
    tarikh_bayar = CURRENT_DATE
WHERE id = 7314
  AND status != 'terbayar';
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check updated payments
SELECT 
    'Payment Status' as check_type,
    id,
    user_ic,
    amount,
    status,
    provider_reference as bill_code,
    webhook_received,
    updated_at
FROM payments
WHERE id IN (
    '09c6b904-dfc7-4fcc-8c2b-554c101fbb96',
    '32d9cc75-87b7-4cf6-9a16-22b2f8acbe84'
);

-- Check updated fees
SELECT 
    'Fee Status' as check_type,
    id,
    student_ic,
    bulan,
    tahun,
    jumlah,
    status,
    cara_bayar,
    tarikh_bayar
FROM fees
WHERE id IN (3672, 7314);

-- Check current month collection summary
SELECT 
    'Current Month Summary' as check_type,
    COUNT(*) as total_paid_fees,
    SUM(jumlah) as total_amount
FROM fees
WHERE status IN ('Bayar', 'terbayar')
  AND MONTH(tarikh_bayar) = MONTH(CURRENT_DATE)
  AND YEAR(tarikh_bayar) = YEAR(CURRENT_DATE);
