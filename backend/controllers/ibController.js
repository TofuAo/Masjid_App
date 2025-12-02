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
        f.document_confirmed,
        f.confirmed_by,
        f.confirmed_at,
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

// Bulk confirm attendance documents by class
export const confirmClassAttendance = async (req, res) => {
  try {
    const { class_id, exclude_student_ics = [], notes = '', confirmed = true } = req.body;
    const confirmedBy = req.user?.ic;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Get all attendance records for the class that have proof images and are not yet confirmed
    let query = `
      SELECT a.id, a.student_ic, a.proof_image, a.document_confirmed
      FROM attendance a
      WHERE a.class_id = ? 
        AND a.proof_image IS NOT NULL 
        AND a.proof_image != ''
    `;
    const queryParams = [class_id];

    // Exclude specific students if provided
    if (exclude_student_ics && exclude_student_ics.length > 0) {
      const placeholders = exclude_student_ics.map(() => '?').join(',');
      query += ` AND a.student_ic NOT IN (${placeholders})`;
      queryParams.push(...exclude_student_ics);
    }

    const [attendanceRecords] = await pool.execute(query, queryParams);

    if (attendanceRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No attendance records found to confirm',
        data: {
          confirmed: 0,
          total: 0
        }
      });
    }

    const isConfirmed = confirmed === true || confirmed === 1 || confirmed === '1';
    const recordIds = attendanceRecords.map(r => r.id);
    const placeholders = recordIds.map(() => '?').join(',');

    // Bulk update confirmation status
    await pool.execute(
      `UPDATE attendance 
       SET document_confirmed = ?,
           confirmed_by = ?,
           confirmed_at = ${isConfirmed ? 'CURRENT_TIMESTAMP' : 'NULL'},
           confirmation_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      [isConfirmed ? 1 : 0, isConfirmed ? confirmedBy : null, notes || null, ...recordIds]
    );

    res.json({
      success: true,
      message: `Successfully ${isConfirmed ? 'confirmed' : 'unconfirmed'} ${attendanceRecords.length} attendance document(s)`,
      data: {
        confirmed: attendanceRecords.length,
        total: attendanceRecords.length,
        excluded: exclude_student_ics.length
      }
    });
  } catch (error) {
    console.error('Error confirming class attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk confirm fee documents by class
export const confirmClassFees = async (req, res) => {
  try {
    const { class_id, exclude_student_ics = [], notes = '', confirmed = true } = req.body;
    const confirmedBy = req.user?.ic;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Get all fee records for students in the class that have receipt images and are not yet confirmed
    let query = `
      SELECT f.id, f.student_ic, f.resit_img, f.document_confirmed
      FROM fees f
      INNER JOIN students s ON f.student_ic = s.user_ic
      WHERE s.kelas_id = ? 
        AND f.resit_img IS NOT NULL 
        AND f.resit_img != ''
    `;
    const queryParams = [class_id];

    // Exclude specific students if provided
    if (exclude_student_ics && exclude_student_ics.length > 0) {
      const placeholders = exclude_student_ics.map(() => '?').join(',');
      query += ` AND f.student_ic NOT IN (${placeholders})`;
      queryParams.push(...exclude_student_ics);
    }

    const [feeRecords] = await pool.execute(query, queryParams);

    if (feeRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No fee records found to confirm',
        data: {
          confirmed: 0,
          total: 0
        }
      });
    }

    const isConfirmed = confirmed === true || confirmed === 1 || confirmed === '1';
    const recordIds = feeRecords.map(r => r.id);
    const placeholders = recordIds.map(() => '?').join(',');

    // Bulk update confirmation status
    await pool.execute(
      `UPDATE fees 
       SET document_confirmed = ?,
           confirmed_by = ?,
           confirmed_at = ${isConfirmed ? 'CURRENT_TIMESTAMP' : 'NULL'},
           confirmation_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      [isConfirmed ? 1 : 0, isConfirmed ? confirmedBy : null, notes || null, ...recordIds]
    );

    res.json({
      success: true,
      message: `Successfully ${isConfirmed ? 'confirmed' : 'unconfirmed'} ${feeRecords.length} fee document(s)`,
      data: {
        confirmed: feeRecords.length,
        total: feeRecords.length,
        excluded: exclude_student_ics.length
      }
    });
  } catch (error) {
    console.error('Error confirming class fees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get class documents for confirmation (attendance and fees)
export const getClassDocuments = async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Get attendance records with documents
    const [attendanceRecords] = await pool.execute(
      `SELECT 
        a.id,
        a.student_ic,
        a.tarikh,
        a.status,
        a.proof_image,
        a.document_confirmed,
        a.confirmed_by,
        a.confirmed_at,
        u.nama as pelajar_nama,
        c.nama_kelas
      FROM attendance a
      INNER JOIN users u ON a.student_ic = u.ic
      INNER JOIN classes c ON a.class_id = c.id
      WHERE a.class_id = ? 
        AND a.proof_image IS NOT NULL 
        AND a.proof_image != ''
      ORDER BY a.tarikh DESC, u.nama ASC`,
      [class_id]
    );

    // Get fee records with documents
    const [feeRecords] = await pool.execute(
      `SELECT 
        f.id,
        f.student_ic,
        f.tarikh,
        f.bulan,
        f.tahun,
        f.jumlah,
        f.status,
        f.resit_img,
        f.document_confirmed,
        f.confirmed_by,
        f.confirmed_at,
        u.nama as pelajar_nama,
        c.nama_kelas
      FROM fees f
      INNER JOIN students s ON f.student_ic = s.user_ic
      INNER JOIN classes c ON s.kelas_id = c.id
      INNER JOIN users u ON f.student_ic = u.ic
      WHERE s.kelas_id = ? 
        AND f.resit_img IS NOT NULL 
        AND f.resit_img != ''
      ORDER BY f.tahun DESC, f.bulan DESC, u.nama ASC`,
      [class_id]
    );

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        fees: feeRecords,
        class_id: parseInt(class_id)
      }
    });
  } catch (error) {
    console.error('Error getting class documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve payments by date range within a month
export const approvePaymentsByDateRange = async (req, res) => {
  try {
    const { bulan, tahun, start_date, end_date, exclude_payment_ids = [], notes = '' } = req.body;
    const confirmedBy = req.user?.ic;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!bulan || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Bulan dan tahun diperlukan'
      });
    }

    // Build query to get payments in the date range
    let query = `
      SELECT f.id, f.student_ic, f.resit_img, f.document_confirmed
      FROM fees f
      WHERE f.bulan = ? AND f.tahun = ?
        AND f.resit_img IS NOT NULL 
        AND f.resit_img != ''
        AND f.status IN ('terbayar', 'Bayar')
    `;
    const queryParams = [bulan, tahun];

    // Add date range filter if provided
    if (start_date && end_date) {
      query += ` AND DATE(f.tarikh_bayar) >= DATE(?) AND DATE(f.tarikh_bayar) <= DATE(?)`;
      queryParams.push(start_date, end_date);
    }

    // Exclude specific payment IDs if provided
    if (exclude_payment_ids && exclude_payment_ids.length > 0) {
      const placeholders = exclude_payment_ids.map(() => '?').join(',');
      query += ` AND f.id NOT IN (${placeholders})`;
      queryParams.push(...exclude_payment_ids);
    }

    const [payments] = await pool.execute(query, queryParams);

    if (payments.length === 0) {
      return res.json({
        success: true,
        message: 'No payments found to confirm',
        data: {
          confirmed: 0,
          total: 0
        }
      });
    }

    const paymentIds = payments.map(p => p.id);
    const placeholders = paymentIds.map(() => '?').join(',');

    // Bulk update confirmation status
    await pool.execute(
      `UPDATE fees 
       SET document_confirmed = 1,
           confirmed_by = ?,
           confirmed_at = CURRENT_TIMESTAMP,
           confirmation_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      [confirmedBy, notes || null, ...paymentIds]
    );

    res.json({
      success: true,
      message: `Successfully confirmed ${payments.length} payment document(s)`,
      data: {
        confirmed: payments.length,
        total: payments.length,
        excluded: exclude_payment_ids.length
      }
    });
  } catch (error) {
    console.error('Error approving payments by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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

