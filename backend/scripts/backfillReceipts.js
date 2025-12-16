import { pool } from '../config/database.js';
import {
  generateFeeReceipt,
  generatePaymentReceipt,
  generateUniqueReceiptNumber
} from '../utils/receiptService.js';

/**
 * Backfill receipts for past payments/fees that are already marked as paid
 * but missing receipt number or receipt file.
 */
async function backfillFeeReceipts() {
  const [fees] = await pool.execute(
    `
      SELECT id, no_resit, resit_img, cara_bayar
      FROM fees
      WHERE status IN ('terbayar', 'Bayar')
        AND (no_resit IS NULL OR resit_img IS NULL)
    `
  );

  let success = 0;
  for (const fee of fees) {
    try {
      const receiptNumber =
        fee.no_resit || (await generateUniqueReceiptNumber(fee.id));

      const receipt = await generateFeeReceipt(fee.id, {
        receiptNumber,
        paymentMethod: fee.cara_bayar || 'ONLINE PAYMENT'
      });

      await pool.execute(
        'UPDATE fees SET no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [receipt.receiptNumber, receipt.receiptPath, fee.id]
      );

      success += 1;
      console.log(
        `✅ Fee receipt backfilled for fee ${fee.id}: ${receipt.receiptNumber}`
      );
    } catch (err) {
      console.error(
        `❌ Failed to backfill fee receipt for fee ${fee.id}:`,
        err?.message || err
      );
    }
  }

  console.log(`Fee receipts backfilled: ${success}/${fees.length}`);
}

async function backfillPaymentReceipts() {
  const [payments] = await pool.execute(
    `
      SELECT id, metadata
      FROM payments
      WHERE status = 'completed'
        AND (metadata IS NULL OR metadata NOT LIKE '%receiptNumber%')
    `
  );

  let success = 0;
  for (const payment of payments) {
    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      const feeId = metadata.fee_id || null;

      const receipt = await generatePaymentReceipt(payment.id, feeId);

      // Store receipt in metadata
      const updatedMeta = {
        ...metadata,
        receiptNumber: receipt.receiptNumber,
        receiptPath: receipt.receiptPath
      };

      await pool.execute(
        'UPDATE payments SET metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(updatedMeta), payment.id]
      );

      success += 1;
      console.log(
        `✅ Payment receipt backfilled for payment ${payment.id}: ${receipt.receiptNumber}`
      );
    } catch (err) {
      console.error(
        `❌ Failed to backfill payment receipt for payment ${payment.id}:`,
        err?.message || err
      );
    }
  }

  console.log(`Payment receipts backfilled: ${success}/${payments.length}`);
}

async function run() {
  try {
    console.log('=== Backfill Receipts Started ===');
    await backfillFeeReceipts();
    await backfillPaymentReceipts();
    console.log('=== Backfill Receipts Completed ===');
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

run();

