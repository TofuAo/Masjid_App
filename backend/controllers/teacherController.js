import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';

export const getAllTeachers = async (req, res) => {
  try {
    const { search, status, page = 1, limit } = req.query;
    // Default to a large limit to show all teachers, or use pagination if specified
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    let query = `
      SELECT u.ic, u.nama, u.email, u.telefon, u.status, COALESCE(t.kepakaran, '[]') as kepakaran, COUNT(DISTINCT c.id) as total_classes
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      LEFT JOIN classes c ON u.ic = c.guru_ic
      WHERE u.role = 'teacher'
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }
    
    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, defaultLimit);
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` GROUP BY u.ic ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [teachers] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.role = 'teacher'
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Format teachers data
    const formattedTeachers = teachers.map(teacher => ({
      ...teacher,
      IC: teacher.ic, // Add uppercase IC for frontend compatibility
      kepakaran: teacher.kepakaran ? (typeof teacher.kepakaran === 'string' ? JSON.parse(teacher.kepakaran) : teacher.kepakaran) : []
    }));

    res.json({
      success: true,
      data: formattedTeachers,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { ic } = req.params;
    
    const [teachers] = await pool.execute(`
      SELECT u.ic, u.nama, u.email, u.telefon, u.status, COALESCE(t.kepakaran, '[]') as kepakaran
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic = ? AND u.role = 'teacher'
    `, [ic]);
    
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Get teacher's classes
    const [classes] = await pool.execute(`
      SELECT c.*, COUNT(s.user_ic) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE c.guru_ic = ?
      GROUP BY c.id
    `, [ic]);
    
    const teacherData = {
      ...teachers[0],
      IC: teachers[0].ic,
      kepakaran: teachers[0].kepakaran ? (typeof teachers[0].kepakaran === 'string' ? JSON.parse(teachers[0].kepakaran) : teachers[0].kepakaran) : [],
      classes: classes.map(c => ({
        ...c,
        sessions: typeof c.sessions === 'string' ? JSON.parse(c.sessions) : c.sessions
      }))
    };

    res.json({
      success: true,
      data: teacherData
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createTeacher = async (req, res) => {
  try {
    console.log('Creating teacher with data:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, telefon, email, password, kepakaran, status } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'teacher', ?)`,
        [ic, nama, telefon, email, password, status]
      );

      // Insert into teachers table
      await connection.execute(
        `INSERT INTO teachers (user_ic, kepakaran) 
         VALUES (?, ?)`,
        [ic, JSON.stringify(kepakaran)]
      );

      await connection.commit();

      const [newTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);
      
      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: newTeacher[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateTeacher = async (req, res) => {
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
    const { nama, telefon, email, kepakaran, status } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update users table
      await connection.execute(
        `UPDATE users SET nama = ?, telefon = ?, email = ?, status = ?
         WHERE ic = ?`,
        [nama, telefon, email, status, ic]
      );

      // Update teachers table
      await connection.execute(
        `UPDATE teachers SET kepakaran = ?
         WHERE user_ic = ?`,
        [JSON.stringify(kepakaran), ic]
      );

      await connection.commit();

      const [updatedTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);
      
      res.json({
        success: true,
        message: 'Teacher updated successfully',
        data: updatedTeacher[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { ic } = req.params;
    
    // The ON DELETE CASCADE in the database schema will handle deleting the teacher record.
    // We just need to delete the user record.
    const [result] = await pool.execute("DELETE FROM users WHERE ic = ? AND role = 'teacher'", [ic]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTeacherStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'tidak_aktif' THEN 1 ELSE 0 END) as tidak_aktif,
        SUM(CASE WHEN status = 'cuti' THEN 1 ELSE 0 END) as cuti
      FROM users
      WHERE role = 'teacher'
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
