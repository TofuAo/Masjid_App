import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { getSafePagination } from '../utils/pagination.js';

export const getAttendance = async (req, res) => {
  try {
    const { date, start_date, end_date, kelas_id, class_id, pelajar_id, page = 1, limit = 50 } = req.query;
    
    // Log all query parameters
    console.log('=== ATTENDANCE API REQUEST ===');
    console.log('Query params:', { date, start_date, end_date, kelas_id, class_id, pelajar_id, page, limit });
    console.log('User role:', req.user?.role);

    let query = `
      SELECT a.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas,
             mu.nama as marked_by_name,
             a.document_confirmed, a.confirmed_by, a.confirmed_at, a.confirmation_notes
      FROM attendance a
      JOIN users u ON a.student_ic = u.ic
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN users mu ON a.marked_by = mu.ic
      WHERE 1=1
    `;

    const queryParams = [];

    // If user is a student, only show their own attendance
    if (req.user && req.user.role === 'student') {
      query += ` AND a.student_ic = ?`;
      queryParams.push(req.user.ic);
    }

    // If user is a teacher, only show attendance for their classes
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(req.user.ic);
    }

    // Handle date range (start_date and end_date) or single date
    if (start_date && end_date) {
      // Date range query
      query += ` AND DATE(a.tarikh) >= DATE(?) AND DATE(a.tarikh) <= DATE(?)`;
      queryParams.push(start_date, end_date);
      console.log('Date range query - start:', start_date, 'end:', end_date);
    } else if (date) {
      // Backward compatibility - single date or month
      if (date.length === 7 && date.match(/^\d{4}-\d{2}$/)) {
        // Month view - filter by month using YEAR and MONTH functions
        const [year, month] = date.split('-');
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (monthNum < 1 || monthNum > 12) {
          console.error('Invalid month in date parameter:', date, 'month:', monthNum);
          return res.status(400).json({
            success: false,
            message: 'Invalid month in date parameter. Month must be between 01-12.',
          });
        }
        
        query += ` AND YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`;
        queryParams.push(yearNum, monthNum);
        console.log('Month view query - date parameter:', date, 'year:', yearNum, 'month:', monthNum);
      } else if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Day view - exact date match
        query += ` AND DATE(a.tarikh) = DATE(?)`;
        queryParams.push(date);
        console.log('Day view query - date:', date);
      } else {
        console.error('Invalid date format:', date);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Expected YYYY-MM (month view) or YYYY-MM-DD (day view).',
        });
      }
    }

    // Support both kelas_id and class_id for compatibility
    const classId = kelas_id || class_id;
    // Only filter by class if a specific class is provided (not 'semua' or undefined)
    if (classId && classId !== 'semua' && classId !== 'undefined') {
      query += ` AND a.class_id = ?`;
      queryParams.push(classId);
    }

    if (pelajar_id) {
      query += ` AND a.student_ic = ?`;
      queryParams.push(pelajar_id);
    }

    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 50);
    query += ` ORDER BY a.tarikh DESC, u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;

    // Debug logging for month view
    if (date && date.length === 7) {
      console.log('=== MONTH VIEW DEBUG ===');
      console.log('Request date param:', date);
      console.log('Query params array:', JSON.stringify(queryParams));
    }

    // Log the full query for debugging
    if (date && date.length === 7) {
      console.log('=== MONTH VIEW QUERY DEBUG ===');
      console.log('Full SQL Query:', query);
      console.log('Query Parameters:', JSON.stringify(queryParams));
    }
    
    const [attendance] = await pool.execute(query, queryParams);
    
    // Debug logging for month view
    if (date && date.length === 7) {
      console.log('Month view - Results count:', attendance.length);
      if (attendance.length > 0) {
        console.log('Month view - First record tarikh:', attendance[0].tarikh);
        console.log('Month view - First record:', {
          id: attendance[0].id,
          tarikh: attendance[0].tarikh,
          student_ic: attendance[0].student_ic,
          class_id: attendance[0].class_id,
          pelajar_nama: attendance[0].pelajar_nama,
          nama_kelas: attendance[0].nama_kelas
        });
      } else {
        console.log('Month view - NO RESULTS FOUND');
        // Try a test query to see if data exists
        try {
          const [testQuery] = await pool.execute(
            'SELECT COUNT(*) as count, MIN(tarikh) as min_date, MAX(tarikh) as max_date FROM attendance'
          );
          console.log('Total attendance records in DB:', testQuery[0]);
          
          // Test the actual query without joins to see if data exists
          const [year, month] = date.split('-');
          const yearNum = parseInt(year, 10);
          const monthNum = parseInt(month, 10);
          const [testMonthQuery] = await pool.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE YEAR(tarikh) = ? AND MONTH(tarikh) = ?',
            [yearNum, monthNum]
          );
          console.log('Records matching month query (without joins):', testMonthQuery[0]);
          
          // Test the query with joins to see if JOINs are filtering out records
          const [testJoinQuery] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM attendance a
             JOIN users u ON a.student_ic = u.ic
             JOIN classes c ON a.class_id = c.id
             WHERE YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`,
            [yearNum, monthNum]
          );
          console.log('Records matching month query (with joins):', testJoinQuery[0]);
          
          // Test with a sample date to see what dates exist
          const [sampleDates] = await pool.execute(
            'SELECT DISTINCT tarikh FROM attendance ORDER BY tarikh DESC LIMIT 10'
          );
          console.log('Sample dates in DB:', sampleDates.map(d => d.tarikh));
        } catch (err) {
          console.log('Test query error:', err.message);
        }
      }
      console.log('=== END MONTH VIEW DEBUG ===');
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance a
      WHERE 1=1
    `;
    const countParams = [];

    // If user is a student, only count their own attendance
    if (req.user && req.user.role === 'student') {
      countQuery += ` AND a.student_ic = ?`;
      countParams.push(req.user.ic);
    }

    // If user is a teacher, only count attendance for their classes
    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM classes c WHERE c.id = a.class_id AND c.guru_ic = ?
      )`;
      countParams.push(req.user.ic);
    }

    // Handle date range (start_date and end_date) or single date for count query
    if (start_date && end_date) {
      countQuery += ` AND DATE(a.tarikh) >= DATE(?) AND DATE(a.tarikh) <= DATE(?)`;
      countParams.push(start_date, end_date);
    } else if (date) {
      // Backward compatibility
      if (date.length === 7 && date.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = date.split('-');
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (monthNum < 1 || monthNum > 12) {
          return;
        }
        
        countQuery += ` AND YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`;
        countParams.push(yearNum, monthNum);
      } else if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        countQuery += ` AND DATE(a.tarikh) = DATE(?)`;
        countParams.push(date);
      }
    }

    // Use the same classId variable from above
    // Only filter by class if a specific class is provided (not 'semua' or undefined)
    if (classId && classId !== 'semua' && classId !== 'undefined') {
      countQuery += ` AND a.class_id = ?`;
      countParams.push(classId);
    }

    if (pelajar_id) {
      countQuery += ` AND a.student_ic = ?`;
      countParams.push(pelajar_id);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Final debug log
    if (date && date.length === 7) {
      console.log('Month view - Final response:', {
        recordsReturned: attendance.length,
        totalInDB: total,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    }

    res.json({
      success: true,
      data: attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { student_ic } = req.params;
    const [attendance] = await pool.execute(`
      SELECT * FROM attendance WHERE student_ic = ?
    `, [student_ic]);

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get student attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN status = 'Cuti' THEN 1 ELSE 0 END) as cuti
      FROM attendance
    `
    );

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Handle PUT request (update by ID)
    if (req.method === 'PUT' && req.params.id) {
      const { status } = req.body;
      const attendanceId = parseInt(req.params.id);
      
      // Check if attendance record exists
      const [existingAttendance] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );
      
      if (existingAttendance.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        });
      }
      
      // Check permissions - teachers can only update their own class attendance
      if (req.user && req.user.role === 'teacher') {
        const [classCheck] = await pool.execute(
          'SELECT guru_ic FROM classes WHERE id = ?',
          [existingAttendance[0].class_id]
        );
        
        if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to update this attendance record',
          });
        }
      }
      
      // Update attendance
      await pool.execute(
        'UPDATE attendance SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, attendanceId]
      );
      
      return res.json({
        success: true,
        message: 'Attendance updated successfully',
      });
    }

    const { student_ic, class_id, tarikh, status } = req.body;
    
    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status',
      });
    }

    // Check if student exists and is in the class
    const [existingStudents] = await pool.execute(
      'SELECT user_ic FROM students WHERE user_ic = ? AND kelas_id = ?',
      [student_ic, class_id]
    );

    if (existingStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found in this class',
      });
    }

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Check if attendance already exists for this date
    const [existingAttendance] = await pool.execute(
      'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );

    if (existingAttendance.length > 0) {
      // Update existing attendance
      await pool.execute(
        `
        UPDATE attendance 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_ic = ? AND class_id = ? AND tarikh = ?
      `,
        [status, student_ic, class_id, attendanceDate]
      );

      res.json({
        success: true,
        message: 'Attendance updated successfully',
      });
    } else {
      // Create new attendance record
      await pool.execute(
        `
        INSERT INTO attendance (student_ic, class_id, tarikh, status)
        VALUES (?, ?, ?, ?)
      `,
        [student_ic, class_id, attendanceDate, status]
      );

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully'
      });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { class_id, tarikh, attendance_data } = req.body;
    
    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      for (const record of attendance_data) {
        const { student_ic, status } = record;

        if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Invalid attendance status',
          });
        }

        // Check if attendance already exists
        const [existingAttendance] = await connection.execute(
          'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
          [student_ic, class_id, attendanceDate]
        );

        if (existingAttendance.length > 0) {
          // Update existing
          await connection.execute(
            `
            UPDATE attendance 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_ic = ? AND class_id = ? AND tarikh = ?
          `,
            [status, student_ic, class_id, attendanceDate]
          );
        } else {
          // Insert new
          await connection.execute(
            `
            INSERT INTO attendance (student_ic, class_id, tarikh, status)
            VALUES (?, ?, ?, ?)
          `,
            [student_ic, class_id, attendanceDate, status]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const bulkMarkAttendanceWithProof = async (req, res) => {
  try {
    const { class_id, tarikh, attendance_data } = req.body;
    
    if (!class_id || !attendance_data) {
      return res.status(400).json({
        success: false,
        message: 'class_id and attendance_data are required',
      });
    }

    // Parse attendance_data if it's a string (from FormData)
    let parsedAttendanceData;
    try {
      parsedAttendanceData = typeof attendance_data === 'string' 
        ? JSON.parse(attendance_data) 
        : attendance_data;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance_data format',
      });
    }

    if (!Array.isArray(parsedAttendanceData) || parsedAttendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendance_data must be a non-empty array',
      });
    }

    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Handle proof image
    let proofImagePath = null;
    if (req.file) {
      proofImagePath = `uploads/${req.file.filename}`;
    }

    // Get user who marked the attendance
    const markedBy = req.user?.ic || null;

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      for (const record of parsedAttendanceData) {
        const { student_ic, status } = record;

        // Allow additional statuses: Lewat, Sakit
        if (!['Hadir', 'Tidak Hadir', 'Cuti', 'Lewat', 'Sakit'].includes(status)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Invalid attendance status: ${status}`,
          });
        }

        // Check if attendance already exists
        const [existingAttendance] = await connection.execute(
          'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
          [student_ic, class_id, attendanceDate]
        );

        if (existingAttendance.length > 0) {
          // Update existing - always update all fields (use NULL if not provided)
          await connection.execute(
            `
            UPDATE attendance 
            SET status = ?, 
                proof_image = ?,
                marked_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE student_ic = ? AND class_id = ? AND tarikh = ?
          `,
            [status, proofImagePath || null, markedBy || null, student_ic, class_id, attendanceDate]
          );
        } else {
          // Insert new - always include all fields (use NULL if not provided)
          await connection.execute(
            `
            INSERT INTO attendance (student_ic, class_id, tarikh, status, proof_image, marked_by)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
            [student_ic, class_id, attendanceDate, status, proofImagePath || null, markedBy || null]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
        proof_image: proofImagePath,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Bulk mark attendance with proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendanceId = parseInt(id);
    
    if (isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID',
      });
    }
    
    // Check if attendance record exists
    const [existingAttendance] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [attendanceId]
    );
    
    if (existingAttendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }
    
    // Delete attendance record
    await pool.execute(
      'DELETE FROM attendance WHERE id = ?',
      [attendanceId]
    );
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const confirmAttendanceDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed, notes } = req.body;
    const confirmedBy = req.user?.ic;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if attendance record exists
    const [existingAttendance] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [id]
    );

    if (existingAttendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const isConfirmed = confirmed === true || confirmed === 1 || confirmed === '1';

    // Update confirmation status
    await pool.execute(
      `UPDATE attendance 
       SET document_confirmed = ?, 
           confirmed_by = ?, 
           confirmed_at = ${isConfirmed ? 'CURRENT_TIMESTAMP' : 'NULL'},
           confirmation_notes = ?
       WHERE id = ?`,
      [isConfirmed ? 1 : 0, isConfirmed ? confirmedBy : null, notes || null, id]
    );

    const [updatedAttendance] = await pool.execute(
      `SELECT a.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas,
              cu.nama as confirmed_by_name
       FROM attendance a
       JOIN users u ON a.student_ic = u.ic
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN users cu ON a.confirmed_by = cu.ic
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: isConfirmed ? 'Document confirmed successfully' : 'Document confirmation removed',
      data: updatedAttendance[0]
    });
  } catch (error) {
    console.error('Confirm attendance document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};