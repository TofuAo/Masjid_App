#!/usr/bin/env node

/**
 * Check ToyyibPay Payment Status Script
 * 
 * This script checks the actual status of payments on ToyyibPay
 * and updates the database accordingly.
 * 
 * Usage:
 *   node checkToyyibPayPayments.js
 *   node checkToyyibPayPayments.js <billCode>
 */

import { pool } from '../config/database.js';
import { getBillStatus } from '../services/toyyibpayService.js';

const checkPaymentStatus = async (paymentId, billCode) => {
  console.log(`\n📋 Checking payment: ${paymentId}`);
  console.log(`   Bill Code: ${billCode}`);
  
  try {
    // Check status from ToyyibPay
    const toyyibPayStatus = await getBillStatus(billCode);
    
    console.log(`   ToyyibPay Status: ${toyyibPayStatus.status}`);
    console.log(`   Amount: RM ${toyyibPayStatus.amount}`);
    console.log(`   Paid At: ${toyyibPayStatus.paidAt || 'N/A'}`);
    console.log(`   Transaction ID: ${toyyibPayStatus.transactionId || 'N/A'}`);
    
    // Get payment from database
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );
    
    if (payments.length === 0) {
      console.log(`   ❌ Payment not found in database`);
      return null;
    }
    
    const payment = payments[0];
    console.log(`   Database Status: ${payment.status}`);
    
    // Check if status needs updating
    if (payment.status !== toyyibPayStatus.status) {
      console.log(`   🔄 Status mismatch - Updating database...`);
      
      // Update payment status
      await pool.execute(
        `UPDATE payments 
         SET status = ?, 
             provider_reference = ?,
             webhook_received = 1,
             webhook_data = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          toyyibPayStatus.status,
          toyyibPayStatus.transactionId || billCode,
          JSON.stringify(toyyibPayStatus),
          paymentId
        ]
      );
      
      console.log(`   ✅ Payment status updated to: ${toyyibPayStatus.status}`);
      
      // If payment is completed, update the related fee
      if (toyyibPayStatus.status === 'completed') {
        const metadata = JSON.parse(payment.metadata || '{}');
        const feeId = metadata.feeId;
        
        if (feeId) {
          console.log(`   🔄 Updating fee ${feeId}...`);
          
          await pool.execute(
            `UPDATE fees 
             SET status = 'terbayar',
                 cara_bayar = 'ToyyibPay',
                 tarikh_bayar = CURRENT_DATE
             WHERE id = ?`,
            [feeId]
          );
          
          console.log(`   ✅ Fee ${feeId} marked as paid`);
        }
      }
      
      return {
        paymentId,
        billCode,
        oldStatus: payment.status,
        newStatus: toyyibPayStatus.status,
        updated: true
      };
    } else {
      console.log(`   ✅ Status already correct`);
      return {
        paymentId,
        billCode,
        status: toyyibPayStatus.status,
        updated: false
      };
    }
    
  } catch (error) {
    console.error(`   ❌ Error checking payment:`, error.message);
    return {
      paymentId,
      billCode,
      error: error.message
    };
  }
};

const checkAllProcessingPayments = async () => {
  console.log('🔍 Finding all payments in "processing" status...\n');
  
  const [payments] = await pool.execute(
    `SELECT id, user_ic, amount, provider_reference, metadata, created_at
     FROM payments 
     WHERE status = 'processing'
       AND provider = 'toyyibpay'
       AND provider_reference IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 50`
  );
  
  console.log(`Found ${payments.length} processing payments\n`);
  
  if (payments.length === 0) {
    console.log('✅ No processing payments found!');
    return [];
  }
  
  const results = [];
  
  for (const payment of payments) {
    const billCode = payment.provider_reference;
    const result = await checkPaymentStatus(payment.id, billCode);
    if (result) {
      results.push(result);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

const checkSpecificBillCode = async (billCode) => {
  console.log(`🔍 Looking for payment with bill code: ${billCode}\n`);
  
  const [payments] = await pool.execute(
    `SELECT id FROM payments WHERE provider_reference = ? LIMIT 1`,
    [billCode]
  );
  
  if (payments.length === 0) {
    console.log(`❌ No payment found with bill code: ${billCode}`);
    return null;
  }
  
  return await checkPaymentStatus(payments[0].id, billCode);
};

// Main execution
const main = async () => {
  console.log('======================================');
  console.log('  ToyyibPay Payment Status Checker');
  console.log('======================================\n');
  
  try {
    const billCode = process.argv[2];
    
    let results;
    if (billCode) {
      results = [await checkSpecificBillCode(billCode)];
    } else {
      results = await checkAllProcessingPayments();
    }
    
    // Summary
    console.log('\n======================================');
    console.log('  Summary');
    console.log('======================================\n');
    
    const updated = results.filter(r => r && r.updated);
    const errors = results.filter(r => r && r.error);
    const unchanged = results.filter(r => r && !r.updated && !r.error);
    
    console.log(`Total Checked: ${results.length}`);
    console.log(`Updated: ${updated.length}`);
    console.log(`Unchanged: ${unchanged.length}`);
    console.log(`Errors: ${errors.length}`);
    
    if (updated.length > 0) {
      console.log('\n✅ Updated Payments:');
      updated.forEach(r => {
        console.log(`   - ${r.billCode}: ${r.oldStatus} → ${r.newStatus}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(r => {
        console.log(`   - ${r.billCode}: ${r.error}`);
      });
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
