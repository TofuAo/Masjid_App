import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { studentCache } from '../utils/studentCache.js';
import {
  createStudentRecord,
  updateStudentRecord,
  deleteStudentRecord
} from '../services/studentService.js';
import { getSafePagination } from '../utils/pagination.js';

import { normalizePhone } from '../utils/phoneNormalizer.js';

export const getAllStudents = async (req, res) => {
  try {
    const { search, kelas_id, page = 1, limit } = req.query;
    // Default to a large limit to show all students, or use pagination if specified
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    // Include user role in cache key to prevent teachers seeing admin cache
    // Status removed from cache key
    const cacheKey = `students:${req.user?.role || 'guest'}:${search}:${kelas_id}:${page}:${limit}`;

    // Check if data is in cache (but skip cache for teachers to ensure filtered results)
    if (!req.user || req.user.role !== 'teacher') {
      if (studentCache.has(cacheKey)) {
        console.log("Data retrieved from cache");
        return res.json(studentCache.get(cacheKey));
      }
    }

    // Only show active students (those with entries in students table, not archived)
    let query = `
      SELECT 
        u.telefon as ic, 
        u.nama, 
        u.email, 
        u.telefon, 
        u.umur, 
        u.alamat, 
        s.kelas_id, 
        s.tarikh_daftar, 
        c.nama_kelas,
        c.level,
        t.nama as guru_nama,
        t.telefon as guru_telefon
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN users t ON c.guru_telefon = t.telefon
      WHERE u.role = 'student'
    `;

    const queryParams = [];

    // If user is a teacher, only show students in their classes
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_telefon = ?`;
      queryParams.push(req.user.telefon);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (kelas_id) {
      query += ` AND s.kelas_id = ?`;
      queryParams.push(kelas_id);
    }

    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);
    query += ` ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [students] = await pool.execute(query, queryParams);

    // Format students data to match frontend expectations
    const formattedStudents = students.map(student => ({
      ...student,
      IC: student.telefon, // Add uppercase IC for frontend compatibility
      kelas_id: student.kelas_id || null,
      nama_kelas: student.nama_kelas || 'Tiada Kelas',
      umur: student.umur || null
    }));

    // Get total count for pagination
    // Only count active students (those with entries in students table)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;
    const countParams = [];

    // If user is a teacher, only count students in their classes
    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND c.guru_telefon = ?`;
      countParams.push(req.user.telefon);
    }

    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
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
    const cleanedPhone = normalizePhone(ic);
    const cacheKey = `student:${cleanedPhone}`;

    // Clear cache for this student to ensure fresh data with teacher information
    // This ensures we always get the latest data including teacher details
    if (studentCache.has(cacheKey)) {
      studentCache.delete(cacheKey);
    }

    const [students] = await pool.execute(`
      SELECT 
        u.telefon as ic, 
        u.nama, 
        u.email, 
        u.status, 
        u.umur, 
        u.alamat, 
        u.telefon,
        s.kelas_id, 
        s.tarikh_daftar, 
        c.nama_kelas,
        c.level,
        t.nama as guru_nama,
        t.telefon as guru_telefon
      FROM users u
      JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN users t ON c.guru_telefon = t.telefon
      WHERE u.telefon = ? AND u.role = 'student'
    `, [cleanedPhone]);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const studentData = students[0];
    console.log('Student data fetched:', {
      ic: studentData.ic,
      nama: studentData.nama,
      kelas_id: studentData.kelas_id,
      nama_kelas: studentData.nama_kelas,
      guru_nama: studentData.guru_nama,
      guru_telefon: studentData.guru_telefon
    });

    const response = {
      success: true,
      data: studentData
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
      const result = await createStudentRecord(req.body, { actorPhone: req.user.telefon });
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: result.student
      });
    } catch (error) {
      console.error('Create student error (inner):', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('Create student error (outer):', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      stack: error.stack
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    // Validate password if provided
    if (req.body.password !== undefined && req.body.password !== null && req.body.password !== '') {
      const passwordStr = String(req.body.password).trim();
      if (passwordStr.length > 0 && passwordStr.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ type: 'field', msg: 'Password must be at least 5 chars long', path: 'password', location: 'body' }]
        });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const result = await updateStudentRecord(req.params.telefon, req.body, { actorPhone: req.user.telefon });
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
      const result = await deleteStudentRecord(req.params.telefon, { actorPhone: req.user.telefon });
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

    // Only count active students (those with entries in students table, not archived)
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) as active,
        0 as inactive,
        0 as on_leave,
        SUM(CASE WHEN DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as new_this_month
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      WHERE u.role = 'student'
    `);
    
    const response = {
      success: true,
      data: {
        total: stats[0].total || 0,
        active: stats[0].active || 0,
        inactive: 0,
        on_leave: 0,
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
