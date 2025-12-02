import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

// Get monthly payment report for confirmation
export const getMonthlyPaymentReport = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Bulan dan tahun diperlukan'
      });
    }

    // Get all payments for the specified month
    const [payments] = await pool.execute(
      `SELECT 
        f.id,
        f.student_ic,
        u.nama as pelajar_nama,
        c.nama_kelas,
        f.jumlah,
        f.status,
        f.tarikh,
        f.tarikh_bayar,
        f.bulan,
        f.tahun,
        f.cara_bayar,
        f.no_resit,
        f.resit_img,
        f.created_at
      FROM fees f
      INNER JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.bulan = ? AND f.tahun = ?
      ORDER BY f.tarikh_bayar DESC, u.nama ASC`,
      [bulan, tahun]
    );

    // Calculate totals
    const totalPayments = payments.length;
    const totalAmount = payments
      .filter(p => p.status === 'terbayar' || p.status === 'Bayar')
      .reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0);
    
    const paidCount = payments.filter(p => p.status === 'terbayar' || p.status === 'Bayar').length;
    const pendingCount = payments.filter(p => p.status === 'tunggak' || p.status === 'Belum Bayar' || !p.status).length;

    // Check if confirmation already exists
    const [existingConfirmation] = await pool.execute(
      `SELECT * FROM payment_confirmations 
       WHERE bulan = ? AND tahun = ?`,
      [bulan, tahun]
    );

    res.json({
      success: true,
      data: {
        bulan,
        tahun,
        payments,
        summary: {
          totalPayments,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paidCount,
          pendingCount
        },
        confirmation: existingConfirmation[0] || null
      }
    });
  } catch (error) {
    console.error('Error getting monthly payment report:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendapatkan laporan pembayaran bulanan',
      error: error.message
    });
  }
};

// Confirm monthly payment report
export const confirmMonthlyPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bulan, tahun, notes, status } = req.body;
    const ibIc = req.user.ic;

    if (!bulan || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Bulan dan tahun diperlukan'
      });
    }

    // Check if confirmation already exists
    const [existing] = await pool.execute(
      `SELECT * FROM payment_confirmations 
       WHERE bulan = ? AND tahun = ?`,
      [bulan, tahun]
    );

    // Calculate confirmation period (5th to 10th of next month)
    const reportDate = new Date(`${tahun}-${getMonthNumber(bulan)}-01`);
    const nextMonth = new Date(reportDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const periodStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5);
    const periodEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);

    // Get payment statistics
    const [payments] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(jumlah) as total_amount
       FROM fees 
       WHERE bulan = ? AND tahun = ?`,
      [bulan, tahun]
    );

    const totalPayments = payments[0]?.total || 0;
    const totalAmount = parseFloat(payments[0]?.total_amount || 0);

    if (existing.length > 0) {
      // Update existing confirmation
      await pool.execute(
        `UPDATE payment_confirmations 
         SET confirmed_by_ic = ?,
             status = ?,
             notes = ?,
             total_payments = ?,
             total_amount = ?,
             confirmation_period_start = ?,
             confirmation_period_end = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE bulan = ? AND tahun = ?`,
        [
          ibIc,
          status || 'confirmed',
          notes || null,
          totalPayments,
          totalAmount,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0],
          bulan,
          tahun
        ]
      );
    } else {
      // Create new confirmation
      await pool.execute(
        `INSERT INTO payment_confirmations 
         (bulan, tahun, confirmed_by_ic, status, notes, total_payments, total_amount, 
          confirmation_period_start, confirmation_period_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bulan,
          tahun,
          ibIc,
          status || 'confirmed',
          notes || null,
          totalPayments,
          totalAmount,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        ]
      );
    }

    // Get updated confirmation
    const [updated] = await pool.execute(
      `SELECT pc.*, u.nama as confirmed_by_name
       FROM payment_confirmations pc
       INNER JOIN users u ON pc.confirmed_by_ic = u.ic
       WHERE pc.bulan = ? AND pc.tahun = ?`,
      [bulan, tahun]
    );

    res.json({
      success: true,
      message: `Laporan pembayaran ${bulan} ${tahun} telah ${status === 'confirmed' ? 'disahkan' : status === 'rejected' ? 'ditolak' : 'ditandakan sebagai pending'}`,
      data: updated[0]
    });
  } catch (error) {
    console.error('Error confirming monthly payment:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengesahkan laporan pembayaran',
      error: error.message
    });
  }
};

// Get list of monthly reports available for confirmation
export const getAvailableMonthlyReports = async (req, res) => {
  try {
    // Get all months that have payments and their confirmation status
    const [reports] = await pool.execute(
      `SELECT 
        f.bulan,
        f.tahun,
        COUNT(DISTINCT f.id) as total_payments,
        SUM(CASE WHEN f.status IN ('terbayar', 'Bayar') THEN f.jumlah ELSE 0 END) as total_amount,
        COUNT(CASE WHEN f.status IN ('terbayar', 'Bayar') THEN 1 END) as paid_count,
        pc.status as confirmation_status,
        pc.confirmed_at,
        pc.confirmed_by_ic,
        u.nama as confirmed_by_name,
        pc.confirmation_period_start,
        pc.confirmation_period_end
      FROM fees f
      LEFT JOIN payment_confirmations pc ON f.bulan = pc.bulan AND f.tahun = pc.tahun
      LEFT JOIN users u ON pc.confirmed_by_ic = u.ic
      GROUP BY f.bulan, f.tahun, pc.status, pc.confirmed_at, pc.confirmed_by_ic, u.nama, 
               pc.confirmation_period_start, pc.confirmation_period_end
      ORDER BY f.tahun DESC, 
               FIELD(f.bulan, 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 
                     'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember') DESC`
    );

    // Get current date to determine which reports are in confirmation period
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const reportsWithStatus = reports.map(report => {
      // Calculate if report is in confirmation period
      let isInConfirmationPeriod = false;
      let canConfirm = false;

      if (report.confirmation_period_start && report.confirmation_period_end) {
        const periodStart = new Date(report.confirmation_period_start);
        const periodEnd = new Date(report.confirmation_period_end);
        isInConfirmationPeriod = now >= periodStart && now <= periodEnd;
        canConfirm = isInConfirmationPeriod && (!report.confirmation_status || report.confirmation_status === 'pending');
      } else {
        // If no confirmation period set, check if it's the confirmation period for last month
        const reportMonth = getMonthNumber(report.bulan);
        const reportYear = report.tahun;
        
        // Confirmation period is 5th-10th of next month
        const nextMonth = reportMonth === 12 ? 1 : reportMonth + 1;
        const nextYear = reportMonth === 12 ? reportYear + 1 : reportYear;
        
        const periodStart = new Date(nextYear, nextMonth - 1, 5);
        const periodEnd = new Date(nextYear, nextMonth - 1, 10);
        
        isInConfirmationPeriod = now >= periodStart && now <= periodEnd;
        canConfirm = isInConfirmationPeriod && (!report.confirmation_status || report.confirmation_status === 'pending');
      }

      return {
        ...report,
        isInConfirmationPeriod,
        canConfirm,
        total_amount: parseFloat(report.total_amount || 0)
      };
    });

    res.json({
      success: true,
      data: reportsWithStatus
    });
  } catch (error) {
    console.error('Error getting available monthly reports:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendapatkan senarai laporan bulanan',
      error: error.message
    });
  }
};

// Helper function to convert month name to number
function getMonthNumber(monthName) {
  if (!monthName) return new Date().getMonth() + 1;
  const months = {
    'Januari': 1, 'Februari': 2, 'Mac': 3, 'April': 4,
    'Mei': 5, 'Jun': 6, 'Julai': 7, 'Ogos': 8,
    'September': 9, 'Oktober': 10, 'November': 11, 'Disember': 12
  };
  return months[monthName] || new Date().getMonth() + 1;
}

