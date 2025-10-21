import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';

export const getAllClasses = async (req, res) => {
  try {
    const { search, status, guru_id, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama, COUNT(s.user_ic) as student_count
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (c.nama_kelas LIKE ? OR u.nama LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND c.status = ?`;
      queryParams.push(status);
    }
    
    if (guru_id) {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(guru_id);
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);
    
    const [classes] = await pool.execute(query, queryParams);

    const parsedClasses = classes.map(kelas => ({
      ...kelas,
      sessions: kelas.sessions ? JSON.parse(kelas.sessions) : []
    }));
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM classes c
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (c.nama_kelas LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm);
    }
    
    if (status) {
      countQuery += ` AND c.status = ?`;
      countParams.push(status);
    }
    
    if (guru_id) {
      countQuery += ` AND c.guru_ic = ?`;
      countParams.push(guru_id);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: parsedClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [classes] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama, u.telefon as guru_telefon
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = {
      ...classes[0],
      sessions: classes[0].sessions ? JSON.parse(classes[0].sessions) : []
    };
    
    // Get students in this class
    const [students] = await pool.execute(`
      SELECT u.ic, u.nama, u.status
      FROM users u
      JOIN students s ON u.ic = s.user_ic
      WHERE s.kelas_id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...classData,
        students
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama_kelas, level, sessions, yuran, guru_ic, kapasiti, status } = req.body;
    
    // Check if teacher exists and is active
    const [teachers] = await pool.execute(
      "SELECT ic FROM users WHERE ic = ? AND role = 'teacher' AND status = 'aktif'",
      [guru_ic]
    );
    
    if (teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or inactive'
      });
    }
    
    // Convert sessions array to JSON string for storage
    const sessionsJson = JSON.stringify(sessions || []);
    
    const [result] = await pool.execute(`
      INSERT INTO classes (nama_kelas, level, sessions, yuran, guru_ic, kapasiti, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nama_kelas, level, sessionsJson, yuran, guru_ic, kapasiti, status]);
    
    const [newClass] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [result.insertId]);

    const parsedNewClass = {
      ...newClass[0],
      sessions: newClass[0].sessions ? JSON.parse(newClass[0].sessions) : []
    };
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: parsedNewClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateClass = async (req, res) => {
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
    const { nama_kelas, level, sessions, yuran, guru_ic, kapasiti, status } = req.body;
    
    // Check if class exists
    const [existingClasses] = await pool.execute(
      'SELECT id FROM classes WHERE id = ?',
      [id]
    );
    
    if (existingClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check if teacher exists and is active
    const [teachers] = await pool.execute(
      "SELECT ic FROM users WHERE ic = ? AND role = 'teacher' AND status = 'aktif'",
      [guru_ic]
    );
    
    if (teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or inactive'
      });
    }
    
    // Convert sessions array to JSON string for storage
    const sessionsJson = JSON.stringify(sessions || []);
    
    await pool.execute(`
      UPDATE classes 
      SET nama_kelas = ?, level = ?, sessions = ?, yuran = ?, guru_ic = ?, kapasiti = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nama_kelas, level, sessionsJson, yuran, guru_ic, kapasiti, status, id]);
    
    const [updatedClass] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [id]);

    const parsedUpdatedClass = {
      ...updatedClass[0],
      sessions: updatedClass[0].sessions ? JSON.parse(updatedClass[0].sessions) : []
    };
    
    res.json({
      success: true,
      message: 'Class updated successfully',
      data: parsedUpdatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if class exists
    const [existingClasses] = await pool.execute(
      'SELECT id FROM classes WHERE id = ?',
      [id]
    );
    
    if (existingClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check if class has active students
    const [activeStudents] = await pool.execute(
      "SELECT COUNT(s.user_ic) as count FROM students s JOIN users u ON s.user_ic = u.ic WHERE s.kelas_id = ? AND u.status = 'aktif'",
      [id]
    );
    
    if (activeStudents[0].count > 0) {
      console.warn(`Attempted to delete class ${id} but it has ${activeStudents[0].count} active students.`);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with active students. Please deactivate or remove all students first.'
      });
    }
    
    const [deleteResult] = await pool.execute('DELETE FROM classes WHERE id = ?', [id]);
    
    if (deleteResult.affectedRows === 0) {
      console.error(`Delete class error: No rows affected for class ID ${id}. Class might not exist or another constraint prevented deletion.`);
      return res.status(404).json({
        success: false,
        message: 'Class not found or could not be deleted.'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error(`Delete class error for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during class deletion'
    });
  }
};

export const getClassStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'tidak_aktif' THEN 1 ELSE 0 END) as tidak_aktif,
        SUM(CASE WHEN status = 'penuh' THEN 1 ELSE 0 END) as penuh,
        SUM(kapasiti) as total_kapasiti,
        AVG(yuran) as average_yuran
      FROM classes
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Dashboard stats endpoint
export const getDashboardStats = async (req, res) => {
  try {
    // Kehadiran Hari Ini (percentage hadir)
    const [attendanceRows] = await pool.execute(`
      SELECT 
        COUNT(*) as total, 
        SUM(status = 'Hadir') as hadir
      FROM attendance
      WHERE tarikh = CURDATE()
    `);
    const attendanceTotal = attendanceRows[0]?.total || 0;
    const attendancePresent = attendanceRows[0]?.hadir || 0;
    const attendanceToday = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

    // Yuran Tertunggak (outstanding fees)
    const [feesRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM fees
      WHERE status = 'Belum Bayar'
    `);
    const feesOutstanding = feesRows[0]?.count || 0;

    // Kelas Aktif (active classes)
    const [classRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM classes
      WHERE status = 'aktif'
    `);
    const classesActive = classRows[0]?.count || 0;

    // Pelajar Baru Bulan Ini (new students this month)
    const [studentsRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM students
      WHERE MONTH(tarikh_daftar) = MONTH(CURDATE()) AND YEAR(tarikh_daftar) = YEAR(CURDATE())
    `);
    const newStudents = studentsRows[0]?.count || 0;

    res.json({
      success: true,
      data: {
        attendanceToday,
        feesOutstanding,
        classesActive,
        newStudents
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
};
