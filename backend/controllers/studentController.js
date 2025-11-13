import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { studentCache } from '../utils/studentCache.js';
import {
  createStudentRecord,
  updateStudentRecord,
  deleteStudentRecord
} from '../services/studentService.js';

const normalizeIcForQuery = (ic) => {
  if (typeof ic !== 'string') {
    return ic;
  }
  return ic.replace(/-/g, '');
};

export const getAllStudents = async (req, res) => {
  try {
    const { search, status, kelas_id, page = 1, limit } = req.query;
    // Default to a large limit to show all students, or use pagination if specified
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    // Include user role in cache key to prevent teachers seeing admin cache
    const cacheKey = `students:${req.user?.role || 'guest'}:${search}:${status}:${kelas_id}:${page}:${limit}`;

    // Check if data is in cache (but skip cache for teachers to ensure filtered results)
    if (!req.user || req.user.role !== 'teacher') {
      if (studentCache.has(cacheKey)) {
        console.log("Data retrieved from cache");
        return res.json(studentCache.get(cacheKey));
      }
    }

    let query = `
      SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.status, s.kelas_id, s.tarikh_daftar, c.nama_kelas
      FROM users u
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;

    const queryParams = [];

    // If user is a teacher, only show students in their classes
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(req.user.ic);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (status) {
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }

    if (kelas_id) {
      query += ` AND s.kelas_id = ?`;
      queryParams.push(kelas_id);
    }

    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, defaultLimit);
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [students] = await pool.execute(query, queryParams);

    // Format students data to match frontend expectations
    const formattedStudents = students.map(student => ({
      ...student,
      IC: student.ic, // Add uppercase IC for frontend compatibility
      kelas_id: student.kelas_id || null,
      nama_kelas: student.nama_kelas || 'Tiada Kelas',
      umur: student.umur || null
    }));

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;
    const countParams = [];

    // If user is a teacher, only count students in their classes
    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND c.guru_ic = ?`;
      countParams.push(req.user.ic);
    }

    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }

    if (kelas_id) {
      countQuery += ` AND s.kelas_id = ?`;
      countParams.push(kelas_id);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    const response = {
      success: true,
      data: formattedStudents,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };

    // Store data in cache
    studentCache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { ic } = req.params;
    const cleanedIc = normalizeIcForQuery(ic);
    const cacheKey = `student:${ic}`;

    // Check if data is in cache
    if (studentCache.has(cacheKey)) {
      console.log("Data retrieved from cache");
      return res.json(studentCache.get(cacheKey));
    }

    const [students] = await pool.execute(`
      SELECT u.ic, u.nama, u.email, u.status, u.umur, u.alamat, s.kelas_id, s.tarikh_daftar, c.nama_kelas
      FROM users u
      JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE REPLACE(u.ic, '-', '') = ? AND u.role = 'student'
    `, [cleanedIc]);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const response = {
      success: true,
      data: students[0]
    };

    // Store data in cache
    studentCache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = errors.array();
      const first = errs[0] || {};
      const friendly = first.msg ? `${first.param ? `${first.param}: ` : ''}${first.msg}` : 'Validation failed';
      return res.status(400).json({
        success: false,
        message: friendly,
        errors: errs
      });
    }

    try {
      const result = await createStudentRecord(req.body, { actorIc: req.user.ic });
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: result.student
      });
    } catch (error) {
      console.error('Create student error:', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const result = await updateStudentRecord(req.params.ic, req.body, { actorIc: req.user.ic });
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: result.student
      });
    } catch (error) {
      console.error('Update student error:', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    try {
      const result = await deleteStudentRecord(req.params.ic, { actorIc: req.user.ic });
      res.json({
        success: true,
        message: 'Student deleted successfully',
        undoToken: result.undoToken,
        undoExpiresAt: result.undoExpiresAt
      });
    } catch (error) {
      console.error('Delete student error:', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const cacheKey = "studentStats";

    if (studentCache.has(cacheKey)) {
      console.log("Data retrieved from cache");
      return res.json(studentCache.get(cacheKey));
    }

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN u.status = 'aktif' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN u.status = 'tidak_aktif' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN u.status = 'cuti' THEN 1 ELSE 0 END) as on_leave,
        SUM(CASE WHEN DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as new_this_month
      FROM users u
      WHERE u.role = 'student'
    `);
    
    const response = {
      success: true,
      data: {
        total: stats[0].total || 0,
        active: stats[0].active || 0,
        inactive: stats[0].inactive || 0,
        on_leave: stats[0].on_leave || 0,
        new_this_month: stats[0].new_this_month || 0
      }
    };

    studentCache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
