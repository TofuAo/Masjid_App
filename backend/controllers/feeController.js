import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendFeePaymentConfirmation } from '../utils/emailService.js';

export const getAllFees = async (req, res) => {
  try {
    const { search, status, bulan, tahun, page = 1, limit = 1000 } = req.query;
    
    // Use LEFT JOIN to show all students, even those without fees
    // Get the most recent fee for each student, or NULL if no fee exists
    let query = `
      SELECT 
        COALESCE(f.id, 0) as id,
        u.ic as student_ic,
        u.nama as pelajar_nama,
        u.ic as pelajar_ic,
        c.nama_kelas,
        COALESCE(f.jumlah, COALESCE(c.yuran, 150.00)) as jumlah,
        COALESCE(f.status, 'Belum Bayar') as status,
        f.tarikh,
        f.tarikh_bayar,
        COALESCE(f.bulan, '') as bulan,
        COALESCE(f.tahun, YEAR(CURDATE())) as tahun,
        f.cara_bayar,
        f.no_resit,
        f.resit_img,
        f.created_at,
        f.updated_at
      FROM users u
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN (
        SELECT f1.*
        FROM fees f1
        INNER JOIN (
          SELECT student_ic, MAX(created_at) as max_created
          FROM fees
          GROUP BY student_ic
        ) f2 ON f1.student_ic = f2.student_ic AND f1.created_at = f2.max_created
      ) f ON u.ic = f.student_ic
      WHERE u.role = 'student' AND u.status = 'aktif'
    `;
    
    const queryParams = [];

    // If user is a student, only show their own fees
    if (req.user && req.user.role === 'student') {
      query += ` AND u.ic = ?`;
      queryParams.push(req.user.ic);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      if (status === 'tunggak' || status === 'Belum Bayar') {
        query += ` AND (f.status IS NULL OR f.status = 'Belum Bayar' OR f.status = 'tunggak' OR f.status = '')`;
      } else if (status === 'terbayar' || status === 'Bayar') {
        query += ` AND f.status IN ('terbayar', 'Bayar')`;
      } else {
        query += ` AND f.status = ?`;
        queryParams.push(status);
      }
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
    query += ` ORDER BY u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [fees] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN students s ON u.ic = s.user_ic
      WHERE u.role = 'student' AND u.status = 'aktif'
    `;
    const countParams = [];

    // If user is a student, only count their own fees
    if (req.user && req.user.role === 'student') {
      countQuery += ` AND u.ic = ?`;
      countParams.push(req.user.ic);
    }
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_ic = u.ic 
        AND f2.status = ?
      )`;
      countParams.push(status);
    }
    
    if (bulan) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_ic = u.ic 
        AND (f2.bulan = ? OR MONTH(f2.tarikh) = ?)
      )`;
      countParams.push(bulan, bulan);
    }
    
    if (tahun) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_ic = u.ic 
        AND (f2.tahun = ? OR YEAR(f2.tarikh) = ?)
      )`;
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
    
    // Normalize IC for lookup (remove dashes and convert to uppercase)
    const normalizedIC = student_ic ? student_ic.replace(/-/g, '').toUpperCase() : null;
    const normalizedICNoDash = normalizedIC ? normalizedIC.replace(/-/g, '') : null;
    
    // Check if student exists - try multiple formats to handle inconsistent IC storage
    let [students] = await pool.execute(
      `SELECT ic FROM users 
       WHERE (
         ic = ? OR 
         ic = ? OR 
         REPLACE(UPPER(ic), '-', '') = ? OR
         REPLACE(UPPER(ic), '-', '') = REPLACE(UPPER(?), '-', '')
       ) AND role = 'student'`,
      [student_ic, normalizedIC, normalizedICNoDash, student_ic]
    );
    
    if (students.length === 0) {
      // Try case-insensitive search as last resort
      [students] = await pool.execute(
        "SELECT ic FROM users WHERE UPPER(REPLACE(ic, '-', '')) = UPPER(REPLACE(?, '-', '')) AND role = 'student'",
        [student_ic]
      );
    }
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found',
        debug: { provided_ic: student_ic, normalized_ic: normalizedIC }
      });
    }
    
    // Use the actual IC from database for consistency
    const actualStudentIC = students[0].ic;
    
    // Use current date/time if not provided
    const now = new Date();
    const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    const feeDate = tarikh || now.toISOString().split('T')[0];
    const feeBulan = bulan || monthNames[now.getMonth()];
    const feeTahun = tahun || now.getFullYear();
    
    // Map frontend status to backend - keep 'terbayar' and 'tunggak' as they are valid in DB
    const backendStatus = status === 'Bayar' ? 'terbayar' : 
                         status === 'Belum Bayar' ? 'tunggak' : 
                         (status || 'tunggak');
    
    // Set tarikh_bayar if status is paid
    const tarikh_bayar = (backendStatus === 'terbayar' || backendStatus === 'Bayar') ? feeDate : null;
    
    // Ensure all values are not undefined (convert to null if undefined)
    const safeActualStudentIC = actualStudentIC || null;
    const safeJumlah = jumlah || 0;
    const safeBackendStatus = backendStatus || 'tunggak';
    const safeFeeDate = feeDate || null;
    const safeTarikhBayar = tarikh_bayar || null;
    const safeFeeBulan = feeBulan || null;
    const safeFeeTahun = feeTahun || null;
    const safeCaraBayar = cara_bayar || null;
    const safeNoResit = no_resit || null;
    const safeResitImg = resit_img || null;
    
    const [result] = await pool.execute(`
      INSERT INTO fees (student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [safeActualStudentIC, safeJumlah, safeBackendStatus, safeFeeDate, safeTarikhBayar, safeFeeBulan, safeFeeTahun, safeCaraBayar, safeNoResit, safeResitImg]);
    
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
      'SELECT id, student_ic FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    // If student_ic is provided, validate it exists
    let actualStudentIC = existingFees[0].student_ic; // Use existing student_ic from fee record
    if (student_ic && student_ic !== existingFees[0].student_ic) {
      // Normalize IC for lookup
      const normalizedIC = student_ic.replace(/-/g, '').toUpperCase();
      const normalizedICNoDash = normalizedIC.replace(/-/g, '');
      
      // Check if student exists - try multiple formats
      let [students] = await pool.execute(
        `SELECT ic FROM users 
         WHERE (
           ic = ? OR 
           ic = ? OR 
           REPLACE(UPPER(ic), '-', '') = ? OR
           REPLACE(UPPER(ic), '-', '') = REPLACE(UPPER(?), '-', '')
         ) AND role = 'student'`,
        [student_ic, normalizedIC, normalizedICNoDash, student_ic]
      );
      
      if (students.length === 0) {
        // Try case-insensitive search as last resort
        [students] = await pool.execute(
          "SELECT ic FROM users WHERE UPPER(REPLACE(ic, '-', '')) = UPPER(REPLACE(?, '-', '')) AND role = 'student'",
          [student_ic]
        );
      }
      
      if (students.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      actualStudentIC = students[0].ic;
    }
    
    // Map frontend status to backend - keep 'terbayar' and 'tunggak' as they are valid in DB
    const backendStatus = status === 'Bayar' ? 'terbayar' : 
                         status === 'Belum Bayar' ? 'tunggak' : 
                         (status || 'tunggak');
    
    // Set tarikh_bayar if status is paid
    const tarikh_bayar = (backendStatus === 'terbayar' || backendStatus === 'Bayar') ? tarikh : null;
    
    await pool.execute(`
      UPDATE fees 
      SET student_ic = ?, jumlah = ?, status = ?, tarikh = ?, tarikh_bayar = ?, bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [actualStudentIC, jumlah, backendStatus, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img, id]);
    
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
