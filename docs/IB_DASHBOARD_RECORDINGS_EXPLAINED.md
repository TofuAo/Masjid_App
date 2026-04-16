# Why There Are "Recordings" When No Payment Exceeding RM 10 Was Done

## What the dashboard shows

- **Jumlah Pembayaran** = number of **fee records (invoices)** for that month, not "number of payments made".
- **Jumlah Terkumpul** = sum of amounts for fees that are **marked as paid** (status `terbayar` or `Bayar`).
- **Telah Dibayar** = count of fee records that are **marked as paid**.

## Why there are many records (e.g. 40)

The system creates **one fee record (yuran) per student per month**. That is by design:

1. **Monthly fee generation job** – On the 1st of each month, the backend creates one row in `fees` for each active student (with amount from the class `yuran`, e.g. RM 150). So 40 students → 40 fee rows for that month.
2. **Seed / mock data** – Scripts or schema may have inserted extra fee rows for testing (e.g. `database/masjid_app_schema.sql`, `backend/scripts/generateMockData.js`).

So **"40 pembayaran"** means **40 invoices (yuran) for that month**, not 40 payments that someone actually made. No payment over RM 10 (or any payment) is required for these rows to exist.

## Why there is "1 paid" and "RM 1.50" (or any amount)

If you see **Telah Dibayar: 1** and **Jumlah Terkumpul: RM 1.50** but you say no payment exceeding RM 10 was done, that usually means:

1. **One real small payment** – Someone recorded a payment of RM 1.50 (or similar). That is consistent with "no payment *exceeding* RM 10".
2. **Test / seed data** – A fee was inserted or updated with a small amount and status `terbayar` (e.g. for demos or testing). That would show as one paid record and RM 1.50 collected.

So the "recording" is: **one fee row** for that month is marked as paid with amount RM 1.50. If that was not a real payment, it can be treated as test data and cleaned (see below).

## Summary

| What you see        | What it actually is                                                                 |
|---------------------|--------------------------------------------------------------------------------------|
| Jumlah Pembayaran 40| 40 **invoices** (fee rows) for that month (auto-created per student + any seed).   |
| Jumlah Terkumpul RM X | Sum of **amounts** of fees marked as paid for that month.                         |
| Telah Dibayar: 1   | One fee row for that month has status **terbayar** / **Bayar**.                     |

So: many "recordings" are **invoices**, not payments. The one "paid" with a small amount is either a real small payment or test data.

## Cleaning test paid records (optional)

If you want to remove paid fees that look like test data (e.g. very small amounts you never actually collected), you can:

1. **Inspect** – List paid fees with amount &lt; 10:
   ```sql
   SELECT id, student_ic, bulan, tahun, jumlah, status, tarikh_bayar
   FROM fees
   WHERE status IN ('terbayar', 'Bayar') AND jumlah < 10;
   ```
2. **Revert to unpaid** – Set those back to "Belum Bayar" so they no longer count as collected:
   ```sql
   UPDATE fees
   SET status = 'Belum Bayar', tarikh_bayar = NULL, cara_bayar = NULL, no_resit = NULL, resit_img = NULL
   WHERE status IN ('terbayar', 'Bayar') AND jumlah < 10;
   ```
   Run only if you are sure these are not real payments.

A small admin script can be added later to do this from the UI or a CLI command if you want.
