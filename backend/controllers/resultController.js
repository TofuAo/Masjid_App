import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import {
  getGradeRangesFromSettings,
  determineGradeForMark
} from '../utils/grading.js';

export const getAllResults = async (req, res) => {
  try {
    const { search, exam_id, gred, year, semester, page = 1, limit = 1000 } = req.query;
    
    let query = `
      SELECT r.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR e.subject LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (exam_id) {
      query += ` AND r.exam_id = ?`;
      queryParams.push(exam_id);
    }
    
    if (gred) {
      query += ` AND r.gred = ?`;
      queryParams.push(gred);
    }
    
    // Filter by exam year
    if (year) {
      query += ` AND YEAR(e.tarikh_exam) = ?`;
      queryParams.push(year);
    }
    
    // Filter by semester (if semester field exists or based on month)
    if (semester) {
      if (semester === '1') {
        query += ` AND MONTH(e.tarikh_exam) BETWEEN 1 AND 6`;
      } else if (semester === '2') {
        query += ` AND MONTH(e.tarikh_exam) BETWEEN 7 AND 12`;
      }
    }
    
    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY e.tarikh_exam DESC, e.subject ASC, u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [results] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      JOIN exams e ON r.exam_id = e.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR e.subject LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (exam_id) {
      countQuery += ` AND r.exam_id = ?`;
      countParams.push(exam_id);
    }
    
    if (gred) {
      countQuery += ` AND r.gred = ?`;
      countParams.push(gred);
    }
    
    // Filter by exam year
    if (year) {
      countQuery += ` AND YEAR(e.tarikh_exam) = ?`;
      countParams.push(year);
    }
    
    // Filter by semester
    if (semester) {
      if (semester === '1') {
        countQuery += ` AND MONTH(e.tarikh_exam) BETWEEN 1 AND 6`;
      } else if (semester === '2') {
        countQuery += ` AND MONTH(e.tarikh_exam) BETWEEN 7 AND 12`;
      }
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getResultById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT r.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.id = ?
    `;
    const queryParams = [id];
    
    const [results] = await pool.execute(query, queryParams);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found or you do not have access to this record'
      });
    }
    
    res.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createResult = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { student_ic, exam_id, markah, slip_img, catatan = null } = req.body;
    const gradeRanges = await getGradeRangesFromSettings();
    const sanitizedMarkah = Math.max(0, Math.min(100, parseInt(markah, 10)));
    const computedGrade = determineGradeForMark(sanitizedMarkah, gradeRanges) || 'F';
    
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
    
    // Check if exam exists
    const [exams] = await pool.execute(
      'SELECT id FROM exams WHERE id = ?',
      [exam_id]
    );
    
    if (exams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam not found'
      });
    }
    
    // Check if result already exists for this student and exam
    const [existingResults] = await pool.execute(
      'SELECT id FROM results WHERE student_ic = ? AND exam_id = ?',
      [student_ic, exam_id]
    );
    
    if (existingResults.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student and exam'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO results (student_ic, exam_id, markah, gred, slip_img, catatan)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [student_ic, exam_id, sanitizedMarkah, computedGrade, slip_img, catatan || null]);
    
    const [newResult] = await pool.execute(`
      SELECT r.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: newResult[0]
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateResult = async (req, res) => {
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
    const { student_ic, exam_id, markah, slip_img, catatan = null } = req.body;
    const gradeRanges = await getGradeRangesFromSettings();
    const sanitizedMarkah = Math.max(0, Math.min(100, parseInt(markah, 10)));
    const computedGrade = determineGradeForMark(sanitizedMarkah, gradeRanges) || 'F';
    
    // Check if result exists
    const [existingResults] = await pool.execute(
      'SELECT id FROM results WHERE id = ?',
      [id]
    );
    
    if (existingResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    // Check if another result exists for this student and exam
    const [duplicateCheck] = await pool.execute(
      'SELECT id FROM results WHERE student_ic = ? AND exam_id = ? AND id != ?',
      [student_ic, exam_id, id]
    );
    
    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student and exam'
      });
    }
    
    await pool.execute(`
      UPDATE results 
      SET student_ic = ?, exam_id = ?, markah = ?, gred = ?, slip_img = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [student_ic, exam_id, sanitizedMarkah, computedGrade, slip_img, catatan || null, id]);
    
    const [updatedResult] = await pool.execute(`
      SELECT r.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult[0]
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if result exists
    const [existingResults] = await pool.execute(
      'SELECT id FROM results WHERE id = ?',
      [id]
    );
    
    if (existingResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    await pool.execute('DELETE FROM results WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getResultStats = async (req, res) => {
  try {
    const { exam_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (exam_id) {
      whereClause += ' AND r.exam_id = ?';
      queryParams.push(exam_id);
    }
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        AVG(r.markah) as average_markah,
        MAX(r.markah) as highest_markah,
        MIN(r.markah) as lowest_markah
      FROM results r
      ${whereClause}
    `, queryParams);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get result stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTopPerformers = async (req, res) => {
  try {
    const { exam_id, limit = 10 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (exam_id) {
      whereClause += ' AND r.exam_id = ?';
      queryParams.push(exam_id);
    }
    
    queryParams.push(parseInt(limit));
    
    const [topPerformers] = await pool.execute(`
      SELECT r.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas, e.subject as exam_subject
      FROM results r
      JOIN users u ON r.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      ${whereClause}
      ORDER BY r.markah DESC, u.nama ASC
      LIMIT ?
    `, queryParams);
    
    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
