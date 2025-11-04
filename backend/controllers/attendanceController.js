import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';

export const getAttendance = async (req, res) => {
  try {
    const { date, kelas_id, pelajar_id, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT a.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas
      FROM attendance a
      JOIN users u ON a.student_ic = u.ic
      JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;

    const queryParams = [];

    // If user is a student, only show their own attendance
    if (req.user && req.user.role === 'student') {
      query += ` AND a.student_ic = ?`;
      queryParams.push(req.user.ic);
    }

    if (date) {
      query += ` AND a.tarikh = ?`;
      queryParams.push(date);
    }

    if (kelas_id) {
      query += ` AND a.class_id = ?`;
      queryParams.push(kelas_id);
    }

    if (pelajar_id) {
      query += ` AND a.student_ic = ?`;
      queryParams.push(pelajar_id);
    }

    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY a.tarikh DESC, u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [attendance] = await pool.execute(query, queryParams);

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

    if (date) {
      countQuery += ` AND a.tarikh = ?`;
      countParams.push(date);
    }

    if (kelas_id) {
      countQuery += ` AND a.class_id = ?`;
      countParams.push(kelas_id);
    }

    if (pelajar_id) {
      countQuery += ` AND a.student_ic = ?`;
      countParams.push(pelajar_id);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

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

    const { student_ic, class_id, tarikh, status } = req.body;

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

    // Check if attendance already exists for this date
    const [existingAttendance] = await pool.execute(
      'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, tarikh]
    );

    if (existingAttendance.length > 0) {
      // Update existing attendance
      await pool.execute(
        `
        UPDATE attendance 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_ic = ? AND class_id = ? AND tarikh = ?
      `,
        [status, student_ic, class_id, tarikh]
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
        [student_ic, class_id, tarikh, status]
      );

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
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

    // Start transaction
    await pool.execute('START TRANSACTION');

    try {
      for (const record of attendance_data) {
        const { student_ic, status } = record;

        if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid attendance status',
          });
        }

        // Check if attendance already exists
        const [existingAttendance] = await pool.execute(
          'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
          [student_ic, class_id, tarikh]
        );

        if (existingAttendance.length > 0) {
          // Update existing
          await pool.execute(
            `
            UPDATE attendance 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_ic = ? AND class_id = ? AND tarikh = ?
          `,
            [status, student_ic, class_id, tarikh]
          );
        } else {
          // Insert new
          await pool.execute(
            `
            INSERT INTO attendance (student_ic, class_id, tarikh, status)
            VALUES (?, ?, ?, ?)
          `,
            [student_ic, class_id, tarikh, status]
          );
        }
      }

      await pool.execute('COMMIT');

      res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
      });
    } catch (error) {
      await pool.execute('ROLLBACK');
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
