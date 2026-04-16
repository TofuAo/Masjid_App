# Receipt Required for Every Payment

Every payment in the system must have receipt data stored. The application enforces this so that no fee or online payment is marked as paid/completed without a receipt record.

## What is stored as “receipt data”

- **Fees (yuran):** `no_resit` (receipt number) and `resit_img` (path to receipt file – generated HTML or uploaded image).
- **Online payments:** Receipt number and path are stored in `payments.metadata` (e.g. `receiptNumber`, `receiptPath`). Receipt file is under `uploads/receipts/`.

## Enforcement

### 1. Fee – create (POST)

- If status is **terbayar** or **Bayar** and no receipt is provided (`no_resit` + `resit_img`), the system generates a receipt after insert.
- If receipt generation fails, the fee is reverted to **tunggak** and the API returns **400** with `RECEIPT_REQUIRED` and message:  
  *Setiap pembayaran mesti mempunyai data resit yang disimpan dalam sistem. Sila muat naik resit atau cuba lagi.*

### 2. Fee – update (PUT)

- If status is changed to **terbayar** or **Bayar** and there is no existing receipt image, the system generates a receipt **before** saving the status.
- If receipt generation fails, the API returns **400** with `RECEIPT_REQUIRED` and the fee status is **not** updated.

### 3. Fee – mark as paid (POST)

- Marking a fee as paid always generates (or uses) a receipt.
- If receipt generation fails, the API returns **400** with `RECEIPT_REQUIRED` and the fee is **not** marked as paid.

### 4. Online payment – completion

- When payment status is updated to **completed**, the system generates and stores the receipt **before** updating the status in the database.
- If receipt generation fails, the status update is **not** committed (payment remains e.g. `processing`). The caller (e.g. webhook) can retry; once receipt is stored, the status can be set to completed.

## API responses

- **400** with `code: 'RECEIPT_REQUIRED'` when a fee cannot be marked as paid because receipt data could not be stored.
- Message text is in Malay and instructs the user to upload a receipt or try again.

## Existing data

Fees or payments that were marked as paid before this rule may have missing receipt data. The IB dashboard and approval flows already treat “missing document” (e.g. no `resit_img`) as requiring attention. Use the backfill script (`backend/scripts/backfillReceipts.js`) if you need to generate receipts for existing paid records.
