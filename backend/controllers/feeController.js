import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendFeePaymentConfirmation } from '../utils/emailService.js';
import { generateMonthlyFeesManually, syncCurrentMonthFeesWithClassYuran } from '../schedulers/monthlyFeeGenerationJob.js';
import { generateFeeReceipt } from '../utils/receiptService.js';
import { getSafePagination } from '../utils/pagination.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

export const getAllFees = async (req, res) => {
  try {
    const { search, status, bulan, tahun, page = 1, limit = 1000 } = req.query;
    
    // Get current month and year for prioritizing current month fees
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const currentMonthName = monthNames[currentMonth];
    
    // Use LEFT JOIN to show all students, even those without fees
    // Prioritize current month's fee, otherwise get the most recent fee
    // For unpaid fees, always use the current class yuran to keep them in sync
    let query = `
      SELECT 
        COALESCE(f.id, 0) as id,
        u.telefon as student_telefon,
        u.nama as pelajar_nama,
        u.telefon as pelajar_ic,
        c.nama_kelas,
        c.nama_kelas as kelas_nama,
        CASE 
          WHEN f.id IS NULL THEN COALESCE(c.yuran, 150.00)
          WHEN f.status IS NULL OR f.status NOT IN ('terbayar', 'Bayar', 'paid', 'Terbayar') THEN COALESCE(c.yuran, 150.00)
          ELSE f.jumlah
        END as jumlah,
        COALESCE(f.status, 'Belum Bayar') as status,
        f.tarikh,
        f.tarikh_bayar,
        COALESCE(f.bulan, '') as bulan,
        COALESCE(f.tahun, YEAR(CURDATE())) as tahun,
        f.cara_bayar,
        f.no_resit,
        f.resit_img,
        f.document_confirmed,
        f.confirmed_by,
        f.confirmed_at,
        f.created_at,
        f.updated_at
      FROM users u
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN (
        SELECT f1.*
        FROM fees f1
        INNER JOIN (
          SELECT student_telefon, 
                 COALESCE(
                   MAX(CASE WHEN f1.bulan = ? AND f1.tahun = ? THEN created_at END),
                   MAX(created_at)
                 ) as max_created
          FROM fees f1
          GROUP BY student_telefon
        ) f2 ON f1.student_telefon = f2.student_telefon AND f1.created_at = f2.max_created
      ) f ON u.telefon = f.student_telefon
      WHERE u.role = 'student'
    `;
    
    const queryParams = [currentMonthName, currentYear];

    // If user is a student, only show their own fees
    if (req.user && req.user.role === 'student') {
      query += ` AND u.telefon = ?`;
      queryParams.push(req.user.telefon);
    }
    
    // If user is a teacher, only show fees for students in their classes
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_telefon = ?`;
      queryParams.push(req.user.telefon);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
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
    
    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 1000);
    query += ` ORDER BY u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [fees] = await pool.execute(query, queryParams);
    
    // Sync unpaid fees with current class yuran amounts in the background
    // This ensures fee records are updated to match class yuran
    if (fees.length > 0) {
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthNames = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const currentMonthName = monthNames[currentMonth];
        
        // Get all unpaid fees for current month that need syncing
        const [unpaidFees] = await pool.execute(`
          SELECT f.id, f.student_telefon, f.jumlah, c.yuran as class_yuran
          FROM fees f
          JOIN users u ON f.student_telefon = u.telefon
          JOIN students s ON u.telefon = s.user_telefon
          JOIN classes c ON s.kelas_id = c.id
          WHERE f.bulan = ?
            AND f.tahun = ?
            AND (f.status IS NULL OR f.status NOT IN ('terbayar', 'Bayar', 'paid', 'Terbayar'))
            AND ABS(f.jumlah - c.yuran) > 0.01
        `, [currentMonthName, currentYear]);
        
        // Update fees that don't match their class yuran
        if (unpaidFees.length > 0) {
          for (const fee of unpaidFees) {
            await pool.execute(`
              UPDATE fees 
              SET jumlah = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [fee.class_yuran, fee.id]);
          }
          console.log(`[Fee Sync] Synced ${unpaidFees.length} unpaid fees with class yuran amounts`);
        }
      } catch (error) {
        // Don't fail the request if sync fails, just log it
        console.error('[Fee Sync] Error syncing fees in getAllFees:', error);
      }
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;
    const countParams = [];

    // If user is a student, only count their own fees
    if (req.user && req.user.role === 'student') {
      countQuery += ` AND u.telefon = ?`;
      countParams.push(req.user.telefon);
    }
    
    // If user is a teacher, only count fees for students in their classes
    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND c.guru_telefon = ?`;
      countParams.push(req.user.telefon);
    }
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_telefon = u.telefon 
        AND f2.status = ?
      )`;
      countParams.push(status);
    }
    
    if (bulan) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_telefon = u.telefon 
        AND (f2.bulan = ? OR MONTH(f2.tarikh) = ?)
      )`;
      countParams.push(bulan, bulan);
    }
    
    if (tahun) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM fees f2 
        WHERE f2.student_telefon = u.telefon 
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
      SELECT f.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas, c.guru_telefon
      FROM fees f
      JOIN users u ON f.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
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
    
    const fee = fees[0];
    
    // If user is a student, only allow access to their own fee
    if (req.user && req.user.role === 'student' && fee.pelajar_ic !== req.user.telefon) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own fee records'
      });
    }
    
    // If user is a teacher, only allow access to fees for students in their classes
    if (req.user && req.user.role === 'teacher' && fee.guru_telefon !== req.user.telefon) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view fee records for students in your classes'
      });
    }
    
    res.json({
      success: true,
      data: fee
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

    const { student_telefon, jumlah, status, tarikh, bulan, tahun, cara_bayar, no_resit, resit_img } = req.body;
    
    // Normalize IC for lookup (remove dashes and convert to uppercase)
    const normalizedIC = student_telefon ? student_telefon.replace(/-/g, '').toUpperCase() : null;
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
      [student_telefon, normalizedIC, normalizedICNoDash, student_telefon]
    );
    
    if (students.length === 0) {
      // Try case-insensitive search as last resort
      [students] = await pool.execute(
        "SELECT ic FROM users WHERE UPPER(REPLACE(ic, '-', '')) = UPPER(REPLACE(?, '-', '')) AND role = 'student'",
        [student_telefon]
      );
    }
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found',
        debug: { provided_ic: student_telefon, normalized_ic: normalizedIC }
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
    
    // Generate receipt if fee is being created as paid
    let receiptNumber = no_resit || null;
    let receiptPath = resit_img || null;
    if ((backendStatus === 'terbayar' || backendStatus === 'Bayar') && !receiptNumber) {
      try {
        const { generateUniqueReceiptNumber } = await import('../utils/receiptService.js');
        receiptNumber = await generateUniqueReceiptNumber();
      } catch (error) {
        console.error('Error generating receipt number:', error);
      }
    }
    
    // Ensure all values are not undefined (convert to null if undefined)
    const safeActualStudentIC = actualStudentIC || null;
    const safeJumlah = jumlah || 0;
    const safeBackendStatus = backendStatus || 'tunggak';
    const safeFeeDate = feeDate || null;
    const safeTarikhBayar = tarikh_bayar || null;
    const safeFeeBulan = feeBulan || null;
    const safeFeeTahun = feeTahun || null;
    const safeCaraBayar = cara_bayar || null;
    const safeNoResit = receiptNumber || null;
    const safeResitImg = receiptPath || null;
    
    const [result] = await pool.execute(`
      INSERT INTO fees (student_telefon, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [safeActualStudentIC, safeJumlah, safeBackendStatus, safeFeeDate, safeTarikhBayar, safeFeeBulan, safeFeeTahun, safeCaraBayar, safeNoResit, safeResitImg]);
    
    // Generate receipt if fee is paid
    if ((backendStatus === 'terbayar' || backendStatus === 'Bayar') && result.insertId) {
      try {
        const receipt = await generateFeeReceipt(result.insertId, {
          receiptNumber: safeNoResit,
          paymentMethod: safeCaraBayar || 'Tunai'
        });
        // Update with generated receipt path
        await pool.execute(
          'UPDATE fees SET resit_img = ?, no_resit = ? WHERE id = ?',
          [receipt.receiptPath, receipt.receiptNumber, result.insertId]
        );
        console.log(`✅ Receipt generated for new fee ${result.insertId}: ${receipt.receiptNumber}`);
      } catch (receiptError) {
        console.error('Error generating receipt for new fee:', receiptError);
        // Continue even if receipt generation fails
      }
    }
    
    const [newFee] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [result.insertId]);
    
    // Create snapshot after create (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'fee',
        entityId: result.insertId,
        entityIdentifier: `${safeActualStudentIC}-${safeFeeBulan}-${safeFeeTahun}`,
        operation: 'create',
        data: newFee[0],
        metadata: {
          title: `Yuran - ${safeActualStudentIC}`,
          notes: `Yuran baru ditambah: RM${safeJumlah} - ${safeBackendStatus}`
        },
        actorPhone
      });
    }
    
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
    const { student_telefon, jumlah, status, tarikh, bulan, tahun, cara_bayar, no_resit, resit_img } = req.body;
    
    // Check if fee exists
    const [existingFees] = await pool.execute(
      'SELECT id, student_telefon FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    // If student_telefon is provided, validate it exists
    let actualStudentIC = existingFees[0].student_telefon; // Use existing student_telefon from fee record
    if (student_telefon && student_telefon !== existingFees[0].student_telefon) {
      // Normalize IC for lookup
      const normalizedIC = student_telefon.replace(/-/g, '').toUpperCase();
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
        [student_telefon, normalizedIC, normalizedICNoDash, student_telefon]
      );
      
      if (students.length === 0) {
        // Try case-insensitive search as last resort
        [students] = await pool.execute(
          "SELECT ic FROM users WHERE UPPER(REPLACE(ic, '-', '')) = UPPER(REPLACE(?, '-', '')) AND role = 'student'",
          [student_telefon]
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
    
    // Get existing fee data for snapshot
    const [existingFeeData] = await pool.execute('SELECT * FROM fees WHERE id = ?', [id]);
    const existingData = existingFeeData[0];
    
    // Create snapshot before update (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic') && existingData) {
      await createSnapshot({
        entityType: 'fee',
        entityId: parseInt(id),
        entityIdentifier: `${existingData.student_telefon}-${existingData.bulan}-${existingData.tahun}`,
        operation: 'update',
        data: existingData,
        metadata: {
          title: `Yuran - ${existingData.student_telefon}`,
          notes: `Yuran dikemaskini: RM${jumlah || existingData.jumlah} - ${backendStatus}`
        },
        actorPhone
      });
    }
    
    // Check if status is changing to paid
    const [currentFee] = await pool.execute('SELECT status, no_resit, resit_img FROM fees WHERE id = ?', [id]);
    const wasPaid = currentFee[0]?.status === 'terbayar' || currentFee[0]?.status === 'Bayar';
    const isNowPaid = backendStatus === 'terbayar' || backendStatus === 'Bayar';
    const statusChangedToPaid = !wasPaid && isNowPaid;
    
    // Generate receipt if status changed to paid and receipt doesn't exist
    let receiptNumber = no_resit || currentFee[0]?.no_resit || null;
    let receiptPath = resit_img || currentFee[0]?.resit_img || null;
    
    if (statusChangedToPaid && !receiptNumber) {
      try {
        const { generateUniqueReceiptNumber } = await import('../utils/receiptService.js');
        receiptNumber = await generateUniqueReceiptNumber(id);
      } catch (error) {
        console.error('Error generating receipt number:', error);
      }
    }
    
    await pool.execute(`
      UPDATE fees 
      SET student_telefon = ?, jumlah = ?, status = ?, tarikh = ?, tarikh_bayar = ?, bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [actualStudentIC, jumlah, backendStatus, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, receiptNumber, receiptPath, id]);
    
    // Generate receipt if status changed to paid
    if (statusChangedToPaid && !receiptPath) {
      try {
        const receipt = await generateFeeReceipt(id, {
          receiptNumber: receiptNumber,
          paymentMethod: cara_bayar || 'Tunai'
        });
        // Update with generated receipt path
        await pool.execute(
          'UPDATE fees SET resit_img = ?, no_resit = ? WHERE id = ?',
          [receipt.receiptPath, receipt.receiptNumber, id]
        );
        receiptPath = receipt.receiptPath;
        receiptNumber = receipt.receiptNumber;
        console.log(`✅ Receipt generated for fee ${id}: ${receipt.receiptNumber}`);
      } catch (receiptError) {
        console.error('Error generating receipt for updated fee:', receiptError);
        // Continue even if receipt generation fails
      }
    }
    
    const [updatedFee] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
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
    
    // Generate unique receipt number if not provided
    let receiptNumber = no_resit;
    if (!receiptNumber) {
      const { generateUniqueReceiptNumber } = await import('../utils/receiptService.js');
      receiptNumber = await generateUniqueReceiptNumber(id);
    }
    const paymentMethod = cara_bayar || 'Tunai';
    
    // Always generate and save receipt for paid fees
    let receiptPath = resit_img || null;
    try {
      const receipt = await generateFeeReceipt(id, {
        receiptNumber,
        paymentMethod
      });
      receiptPath = receipt.receiptPath;
      receiptNumber = receipt.receiptNumber; // Use the receipt number from generated receipt
      console.log(`✅ Receipt generated for fee ${id}: ${receipt.receiptNumber}`);
    } catch (receiptError) {
      console.error('Error generating receipt:', receiptError);
      // If receipt generation fails, we should still proceed but log the error
      // The receipt number will still be saved to the fee record
    }
    
    await pool.execute(`
      UPDATE fees 
      SET status = 'terbayar', tarikh = CURDATE(), tarikh_bayar = CURDATE(), bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [bulan, tahun, paymentMethod, receiptNumber, receiptPath, id]);
    
    // Send confirmation email to student
    try {
      const [updatedFee] = await pool.execute(`
        SELECT f.*, u.email, u.nama as pelajar_nama
        FROM fees f
        JOIN users u ON f.student_telefon = u.telefon
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
    
    // Get updated fee with receipt info
    const [updatedFee] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Fee marked as paid successfully',
      data: {
        ...updatedFee[0],
        receiptNumber,
        receiptPath: receiptPath ? `/uploads/${receiptPath}` : null
      }
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
    
    // Check if fee exists and get full data
    const [existingFees] = await pool.execute(
      'SELECT * FROM fees WHERE id = ?',
      [id]
    );
    
    if (existingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }
    
    const feeData = existingFees[0];
    const actorPhone = req.user?.telefon;
    
    // Create snapshot before delete (only for admin/PIC)
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'fee',
        entityId: parseInt(id),
        entityIdentifier: `${feeData.student_telefon}-${feeData.bulan}-${feeData.tahun}`,
        operation: 'delete',
        data: feeData,
        metadata: {
          title: `Yuran - ${feeData.student_telefon}`,
          notes: `Yuran dipadam: RM${feeData.jumlah} - ${feeData.status}`
        },
        actorPhone
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

/**
 * Manually generate monthly fees (Admin only)
 * POST /api/fees/generate-monthly
 * Body: { month?: number (0-11), year?: number }
 */
export const generateMonthlyFees = async (req, res) => {
  try {
    // Only admin can trigger manual fee generation
    if (req.user?.role !== 'admin' && req.user?.activeRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can generate fees manually'
      });
    }

    const { month, year } = req.body;
    
    const result = await generateMonthlyFeesManually(month, year);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Generate monthly fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly fees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Sync current month fees with class yuran (Admin only)
 * POST /api/fees/sync-current-month
 */
export const syncCurrentMonthFees = async (req, res) => {
  try {
    // Only admin can trigger sync
    if (req.user?.role !== 'admin' && req.user?.activeRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can sync fees'
      });
    }

    const result = await syncCurrentMonthFeesWithClassYuran();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Sync current month fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync current month fees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const confirmFeeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed, notes } = req.body;
    const confirmedBy = req.user?.telefon;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if fee record exists
    const [existingFee] = await pool.execute(
      'SELECT * FROM fees WHERE id = ?',
      [id]
    );

    if (existingFee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    const isConfirmed = confirmed === true || confirmed === 1 || confirmed === '1';

    // Update confirmation status
    await pool.execute(
      `UPDATE fees 
       SET document_confirmed = ?, 
           confirmed_by = ?, 
           confirmed_at = ${isConfirmed ? 'CURRENT_TIMESTAMP' : 'NULL'},
           confirmation_notes = ?
       WHERE id = ?`,
      [isConfirmed ? 1 : 0, isConfirmed ? confirmedBy : null, notes || null, id]
    );

    const [updatedFee] = await pool.execute(
      `SELECT f.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas,
              cu.nama as confirmed_by_name
       FROM fees f
       JOIN users u ON f.student_telefon = u.telefon
       LEFT JOIN students s ON u.telefon = s.user_telefon
       LEFT JOIN classes c ON s.kelas_id = c.id
       LEFT JOIN users cu ON f.confirmed_by = cu.telefon
       WHERE f.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: isConfirmed ? 'Document confirmed successfully' : 'Document confirmation removed',
      data: updatedFee[0]
    });
  } catch (error) {
    console.error('Confirm fee document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};