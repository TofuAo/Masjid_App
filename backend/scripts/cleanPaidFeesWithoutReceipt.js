/**
 * Clean paid fees that have no receipt data.
 * Finds all fees marked as paid (terbayar/Bayar) where no_resit or resit_img is missing,
 * and reverts them to unpaid (tunggak) so the project has no "paid" record without a receipt.
 *
 * Usage (from repo root):
 *   node backend/scripts/cleanPaidFeesWithoutReceipt.js [--dry-run]
 * From backend dir: node scripts/cleanPaidFeesWithoutReceipt.js [--dry-run]
 * With Docker: docker-compose exec backend node scripts/cleanPaidFeesWithoutReceipt.js [--dry-run]
 *
 *   --dry-run  Only list affected rows; do not update.
 */

import { pool } from '../config/database.js';

const DRY_RUN = process.argv.includes('--dry-run');

const HAS_RECEIPT = `(
  no_resit IS NOT NULL AND TRIM(COALESCE(no_resit, '')) != ''
  AND resit_img IS NOT NULL AND TRIM(COALESCE(resit_img, '')) != ''
)`;

const PAID_NO_RECEIPT = `
  SELECT id, student_ic, jumlah, status, bulan, tahun, no_resit, resit_img, tarikh_bayar
  FROM fees
  WHERE status IN ('terbayar', 'Bayar')
    AND NOT ${HAS_RECEIPT}
  ORDER BY tahun DESC, FIELD(bulan, 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember') DESC
`;

async function run() {
  console.log('Checking paid fees for missing receipt data...\n');

  const [rows] = await pool.execute(PAID_NO_RECEIPT);

  if (rows.length === 0) {
    console.log('✅ No paid fees without receipt data. Nothing to clean.');
    process.exit(0);
    return;
  }

  console.log(`Found ${rows.length} paid fee(s) without receipt:\n`);
  rows.forEach((r, i) => {
    console.log(
      `  ${i + 1}. id=${r.id} student_ic=${r.student_ic} bulan=${r.bulan} ${r.tahun} jumlah=${r.jumlah} no_resit=${r.no_resit || '(empty)'} resit_img=${r.resit_img ? 'set' : '(empty)'}`
    );
  });

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes made. Run without --dry-run to revert these to unpaid.');
    process.exit(0);
    return;
  }

  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  // Revert to unpaid: clear paid/receipt fields and document confirmation
  const [cols] = await pool.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fees' AND COLUMN_NAME IN ('document_confirmed','confirmed_by','confirmed_at','confirmation_notes')"
  );
  const hasDocCols = cols.length > 0;

  let updateSql = `
    UPDATE fees
    SET status = 'tunggak',
        tarikh_bayar = NULL,
        cara_bayar = NULL,
        no_resit = NULL,
        resit_img = NULL,
        updated_at = CURRENT_TIMESTAMP
  `;
  if (hasDocCols) {
    updateSql += `,
        document_confirmed = 0,
        confirmed_by = NULL,
        confirmed_at = NULL,
        confirmation_notes = NULL
    `;
  }
  updateSql += ` WHERE id IN (${placeholders})`;

  const [result] = await pool.execute(updateSql, ids);
  console.log(`\n✅ Reverted ${result.affectedRows} fee(s) to unpaid (removed paid/receipt data).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
