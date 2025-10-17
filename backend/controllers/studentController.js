import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import NodeCache from 'node-cache';

const studentCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

export const getAllStudents = async (req, res) => {
  try {
    const { search, status, kelas_id, page = 1, limit = 10 } = req.query;
    const cacheKey = `students:${search}:${status}:${kelas_id}:${page}:${limit}`;

    // Check if data is in cache
    if (studentCache.has(cacheKey)) {
      console.log("Data retrieved from cache");
      return res.json(studentCache.get(cacheKey));
    }

    let query = `
      SELECT u.ic, u.full_name, u.email, u.is_active, s.kelas_id, s.tarikh_daftar, c.class_name
      FROM users u
      JOIN students s ON u.ic = s.ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;

    const queryParams = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (status) {
      query += ` AND u.is_active = ?`;
      queryParams.push(status);
    }

    if (kelas_id) {
      query += ` AND s.kelas_id = ?`;
      queryParams.push(kelas_id);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    const [students] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN students s ON u.ic = s.ic
      WHERE u.role = 'student'
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.full_name LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (status) {
      countQuery += ` AND u.is_active = ?`;
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
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
    const cacheKey = `student:${ic}`;

    // Check if data is in cache
    if (studentCache.has(cacheKey)) {
      console.log("Data retrieved from cache");
      return res.json(studentCache.get(cacheKey));
    }

    const [students] = await pool.execute(`
      SELECT u.ic, u.full_name, u.email, u.is_active, u.umur, u.alamat, s.kelas_id, s.tarikh_daftar, c.class_name
      FROM users u
      JOIN students s ON u.ic = s.ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.ic = ? AND u.role = 'student'
    `, [ic]);

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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { full_name, ic, umur, alamat, telefon, email, password, kelas_id, is_active, tarikh_daftar } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table
      await connection.execute(
        `INSERT INTO users (ic, full_name, umur, alamat, telefon, email, password, role, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
        [ic, full_name, umur, alamat, telefon, email, password, is_active]
      );

      // Insert into students table
      await connection.execute(
        `INSERT INTO students (ic, kelas_id, tarikh_daftar) 
         VALUES (?, ?, ?)`,
        [ic, kelas_id, tarikh_daftar]
      );

      await connection.commit();

      const [newStudent] = await pool.execute(`
        SELECT u.ic, u.full_name, u.email, u.is_active, u.telefon, s.kelas_id, s.tarikh_daftar, c.class_name
        FROM users u
        JOIN students s ON u.ic = s.ic
        LEFT JOIN classes c ON s.kelas_id = c.id
        WHERE u.ic = ?
      `, [ic]);
      
      studentCache.flushAll();
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: newStudent[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
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

    const { ic } = req.params;
    const { full_name, umur, alamat, telefon, email, kelas_id, is_active, tarikh_daftar } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update users table
      await connection.execute(
        `UPDATE users SET full_name = ?, umur = ?, alamat = ?, telefon = ?, email = ?, is_active = ?
         WHERE ic = ?`,
        [full_name, umur, alamat, telefon, email, is_active, ic]
      );

      // Update students table
      await connection.execute(
        `UPDATE students SET kelas_id = ?, tarikh_daftar = ?
         WHERE ic = ?`,
        [kelas_id, tarikh_daftar, ic]
      );

      await connection.commit();

      const [updatedStudent] = await pool.execute(`
        SELECT u.ic, u.full_name, u.email, u.is_active, u.telefon, s.kelas_id, s.tarikh_daftar, c.class_name
        FROM users u
        JOIN students s ON u.ic = s.ic
        LEFT JOIN classes c ON s.kelas_id = c.id
        WHERE u.ic = ?
      `, [ic]);
      
      studentCache.flushAll();
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
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
    const { ic } = req.params;
    
    // The ON DELETE CASCADE in the database schema will handle deleting the student record.
    // We just need to delete the user record.
    const [result] = await pool.execute("DELETE FROM users WHERE ic = ? AND role = 'student'", [ic]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    studentCache.flushAll();
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
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
        SUM(CASE WHEN is_active = 'aktif' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 'tidak_aktif' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN is_active = 'cuti' THEN 1 ELSE 0 END) as on_leave,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as new_this_month
      FROM users
      WHERE role = 'student'
    `);
    
    const response = {
      success: true,
      data: stats[0]
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
