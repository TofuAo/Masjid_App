import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendFeePaymentConfirmation } from '../utils/emailService.js';

export const getAllFees = async (req, res) => {
  try {
    const { search, status, bulan, tahun, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT f.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    // If user is a student, only show their own fees
    if (req.user && req.user.role === 'student') {
      query += ` AND f.student_ic = ?`;
      queryParams.push(req.user.ic);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR f.resit_img LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND f.status = ?`;
      queryParams.push(status);
    }
    
    if (bulan) {
      // Support both month name and number
      if (isNaN(bulan)) {
        query += ` AND f.bulan = ?`;
      } else {
        query += ` AND (f.bulan = ? OR MONTH(f.tarikh) = ?)`;
        queryParams.push(bulan);
      }
      queryParams.push(bulan);
    }
    
    if (tahun) {
      query += ` AND (f.tahun = ? OR YEAR(f.tarikh) = ?)`;
      queryParams.push(tahun, tahun);
    }
    
    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY f.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [fees] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      WHERE 1=1
    `;
    const countParams = [];

    // If user is a student, only count their own fees
    if (req.user && req.user.role === 'student') {
      countQuery += ` AND f.student_ic = ?`;
      countParams.push(req.user.ic);
    }
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR f.resit_img LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND f.status = ?`;
      countParams.push(status);
    }
    
    if (bulan) {
      // Support both month name and number
      if (isNaN(bulan)) {
        countQuery += ` AND f.bulan = ?`;
      } else {
        countQuery += ` AND (f.bulan = ? OR MONTH(f.tarikh) = ?)`;
        countParams.push(bulan);
      }
      countParams.push(bulan);
    }
    
    if (tahun) {
      countQuery += ` AND (f.tahun = ? OR YEAR(f.tarikh) = ?)`;
      countParams.push(tahun, tahun);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: fees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFeeById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT f.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `;
    const queryParams = [id];
    
    const [fees] = await pool.execute(query, queryParams);
    
    if (fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found or you do not have access to this record'
      });
    }
    
    res.json({
      success: true,
      data: fees[0]
    });
  } catch (error) {
    console.error('Get fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { student_ic, jumlah, status, tarikh, bulan, tahun, cara_bayar, no_resit, resit_img } = req.body;
    
    // Check if student exists
    const [students] = await pool.execute(
      "SELECT ic FROM users WHERE ic = ? AND role = 'student'",
      [student_ic]
    );
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Map frontend status to backend if needed
    const backendStatus = status === 'terbayar' ? 'Bayar' : 
                         status === 'tunggak' ? 'Belum Bayar' : 
                         status || 'Belum Bayar';
    
    // Set tarikh_bayar if status is paid
    const tarikh_bayar = (backendStatus === 'Bayar' || backendStatus === 'terbayar') ? tarikh : null;
    
    const [result] = await pool.execute(`
      INSERT INTO fees (student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_ic, jumlah, backendStatus, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img]);
    
    const [newFee] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Fee record created successfully',
      data: newFee[0]
    });
  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { student_ic, jumlah, status, tarikh, bulan, tahun, cara_bayar, no_resit, resit_img } = req.body;
    
    // Check if fee exists
    const [existingFees] = await pool.execute(
      'SELECT id FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    // Map frontend status to backend if needed
    const backendStatus = status === 'terbayar' ? 'Bayar' : 
                         status === 'tunggak' ? 'Belum Bayar' : 
                         status || 'Belum Bayar';
    
    // Set tarikh_bayar if status is paid
    const tarikh_bayar = (backendStatus === 'Bayar' || backendStatus === 'terbayar') ? tarikh : null;
    
    await pool.execute(`
      UPDATE fees 
      SET student_ic = ?, jumlah = ?, status = ?, tarikh = ?, tarikh_bayar = ?, bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [student_ic, jumlah, backendStatus, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img, id]);
    
    const [updatedFee] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Fee record updated successfully',
      data: updatedFee[0]
    });
  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { cara_bayar, no_resit, resit_img } = req.body;
    
    // Check if fee exists
    const [existingFees] = await pool.execute(
      'SELECT id, status, bulan, tahun FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    const currentStatus = existingFees[0].status;
    if (currentStatus === 'Bayar' || currentStatus === 'terbayar') {
      return res.status(400).json({
        success: false,
        message: 'Fee is already marked as paid'
      });
    }
    
    // Get existing bulan/tahun from fee record, or use current date
    const fee = existingFees[0];
    let bulan = fee.bulan;
    let tahun = fee.tahun;
    
    // If bulan/tahun not set, use current date
    if (!bulan || !tahun) {
      const now = new Date();
      const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
      bulan = monthNames[now.getMonth()];
      tahun = now.getFullYear();
    }
    
    // Generate receipt number if not provided
    const receiptNumber = no_resit || `R${String(id).padStart(3, '0')}`;
    const paymentMethod = cara_bayar || 'Tunai';
    
    await pool.execute(`
      UPDATE fees 
      SET status = 'terbayar', tarikh = CURDATE(), tarikh_bayar = CURDATE(), bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [bulan, tahun, paymentMethod, receiptNumber, resit_img || null, id]);
    
    // Send confirmation email to student
    try {
      const [updatedFee] = await pool.execute(`
        SELECT f.*, u.email, u.nama as pelajar_nama
        FROM fees f
        JOIN users u ON f.student_ic = u.ic
        WHERE f.id = ?
      `, [id]);
      
      if (updatedFee.length > 0 && updatedFee[0].email) {
        await sendFeePaymentConfirmation(
          updatedFee[0].email,
          updatedFee[0].pelajar_nama,
          bulan,
          tahun,
          updatedFee[0].jumlah,
          receiptNumber
        );
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'Fee marked as paid successfully'
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if fee exists
    const [existingFees] = await pool.execute(
      'SELECT id FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    await pool.execute('DELETE FROM fees WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFeeStats = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (bulan) {
      whereClause += ' AND MONTH(f.tarikh) = ?';
      queryParams.push(bulan);
    }
    
    if (tahun) {
      whereClause += ' AND YEAR(f.tarikh) = ?';
      queryParams.push(tahun);
    }
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN f.status IN ('Bayar', 'terbayar') THEN 1 ELSE 0 END) as terbayar,
        SUM(CASE WHEN f.status IN ('Belum Bayar', 'tunggak') THEN 1 ELSE 0 END) as tunggak,
        SUM(CASE WHEN f.status IN ('Bayar', 'terbayar') THEN f.jumlah ELSE 0 END) as total_kutipan,
        SUM(CASE WHEN f.status IN ('Belum Bayar', 'tunggak') THEN f.jumlah ELSE 0 END) as total_tunggak
      FROM fees f
      ${whereClause}
    `, queryParams);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get fee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
