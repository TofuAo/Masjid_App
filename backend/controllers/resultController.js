import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import {
  getGradeRangesFromSettings,
  determineGradeForMark
} from '../utils/grading.js';
import { getSafePagination } from '../utils/pagination.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

export const getAllResults = async (req, res) => {
  try {
    const { search, exam_id, gred, year, semester, student_telefon, page = 1, limit = 1000 } = req.query;
    const effectiveRole = req.user?.role || req.user?.activeRole;
    const isStudent = effectiveRole === 'student';
    const studentFilterTelefon = isStudent ? (req.user?.telefon || req.user?.userId) : student_telefon;

    let query = `
      SELECT r.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas as kelas_nama, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    if (studentFilterTelefon) {
      query += ` AND r.student_telefon = ?`;
      queryParams.push(studentFilterTelefon);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.telefon LIKE ? OR e.subject LIKE ?)`;
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
    
    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 1000);
    query += ` ORDER BY e.tarikh_exam DESC, e.subject ASC, u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [results] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE 1=1
    `;
    const countParams = [];

    if (studentFilterTelefon) {
      countQuery += ` AND r.student_telefon = ?`;
      countParams.push(studentFilterTelefon);
    }
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ? OR e.subject LIKE ?)`;
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
      SELECT r.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas as kelas_nama, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
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

    const { student_telefon, exam_id, markah, slip_img, catatan = null } = req.body;
    const gradeRanges = await getGradeRangesFromSettings();
    const sanitizedMarkah = Math.max(0, Math.min(100, parseInt(markah, 10)));
    const computedGrade = determineGradeForMark(sanitizedMarkah, gradeRanges) || 'F';
    
    // Check if student exists
    const [students] = await pool.execute(
      "SELECT telefon FROM users WHERE telefon = ? AND role = 'student'",
      [student_telefon]
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
      'SELECT id FROM results WHERE student_telefon = ? AND exam_id = ?',
      [student_telefon, exam_id]
    );
    
    if (existingResults.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student and exam'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO results (student_telefon, exam_id, markah, gred, slip_img, catatan)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [student_telefon, exam_id, sanitizedMarkah, computedGrade, slip_img, catatan || null]);
    
    const [newResult] = await pool.execute(`
      SELECT r.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas as kelas_nama, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.id = ?
    `, [result.insertId]);
    
    // Create snapshot after create (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'result',
        entityId: result.insertId,
        entityIdentifier: `${student_telefon}-${exam_id}`,
        operation: 'create',
        data: newResult[0],
        metadata: {
          title: `Keputusan - ${student_telefon}`,
          notes: `Keputusan baru ditambah: ${sanitizedMarkah}% (${computedGrade})`
        },
        actorPhone
      });
    }
    
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
    const { student_telefon, exam_id, markah, slip_img, catatan = null } = req.body;
    const gradeRanges = await getGradeRangesFromSettings();
    const sanitizedMarkah = Math.max(0, Math.min(100, parseInt(markah, 10)));
    const computedGrade = determineGradeForMark(sanitizedMarkah, gradeRanges) || 'F';
    
    // Check if result exists and get existing data
    const [existingResults] = await pool.execute(
      'SELECT * FROM results WHERE id = ?',
      [id]
    );
    
    if (existingResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    const existingData = existingResults[0];
    
    // Create snapshot before update (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'result',
        entityId: parseInt(id),
        entityIdentifier: `${existingData.student_telefon}-${existingData.exam_id}`,
        operation: 'update',
        data: existingData,
        metadata: {
          title: `Keputusan - ${existingData.student_telefon}`,
          notes: `Keputusan dikemaskini: ${sanitizedMarkah}% (${computedGrade})`
        },
        actorPhone
      });
    }
    
    // Check if another result exists for this student and exam
    const [duplicateCheck] = await pool.execute(
      'SELECT id FROM results WHERE student_telefon = ? AND exam_id = ? AND id != ?',
      [student_telefon, exam_id, id]
    );
    
    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student and exam'
      });
    }
    
    await pool.execute(`
      UPDATE results 
      SET student_telefon = ?, exam_id = ?, markah = ?, gred = ?, slip_img = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [student_telefon, exam_id, sanitizedMarkah, computedGrade, slip_img, catatan || null, id]);
    
    const [updatedResult] = await pool.execute(`
      SELECT r.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas as kelas_nama, e.subject as exam_subject, e.tarikh_exam as exam_date
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
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
    
    // Check if result exists and get full data
    const [existingResults] = await pool.execute(
      'SELECT * FROM results WHERE id = ?',
      [id]
    );
    
    if (existingResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    const resultData = existingResults[0];
    const actorPhone = req.user?.telefon;
    
    // Create snapshot before delete (only for admin/PIC)
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'result',
        entityId: parseInt(id),
        entityIdentifier: `${resultData.student_telefon}-${resultData.exam_id}`,
        operation: 'delete',
        data: resultData,
        metadata: {
          title: `Keputusan - ${resultData.student_telefon}`,
          notes: `Keputusan dipadam: ${resultData.markah}% (${resultData.gred})`
        },
        actorPhone
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
      SELECT r.*, u.nama as pelajar_nama, u.telefon as pelajar_ic, c.nama_kelas as kelas_nama, e.subject as exam_subject
      FROM results r
      JOIN users u ON r.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
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
