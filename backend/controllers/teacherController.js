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
      SELECT 
        c.id, 
        c.nama_kelas, 
        c.level, 
        c.sessions, 
        c.yuran, 
        c.guru_ic, 
        c.kapasiti, 
        c.status, 
        c.jadual,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT s.user_ic) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE c.guru_ic = ?
      GROUP BY c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, c.jadual, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
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
    const emailValue = email && email.trim() !== '' ? email.trim() : null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        "SELECT * FROM users WHERE ic = ?",
        [ic]
      );

      if (existingUsers && existingUsers.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Nombor IC ini sudah didaftarkan. Sila log masuk atau gunakan nombor IC lain.'
        });
      }

      // Check if email already exists (if provided)
      if (email && email.trim() !== '') {
        const [existingEmails] = await connection.execute(
          "SELECT * FROM users WHERE email = ?",
          [email.trim()]
        );

        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.'
          });
        }
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);

      // Insert into users table (email is optional)
      // For public registration, set status to 'pending' - requires admin approval
      const emailValue = email && email.trim() !== '' ? email : null;
      const registrationStatus = req.user ? status : 'pending'; // If authenticated (admin/teacher), use provided status, otherwise 'pending'
      
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'teacher', ?)`,
        [ic, nama, telefon, emailValue, hashedPassword, registrationStatus]
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

    const { ic } = req.params;
    const { nama, telefon, email, kepakaran, status, password } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Build dynamic UPDATE query for users table - only update provided fields
      const userUpdates = {};
      if (nama !== undefined) userUpdates.nama = nama;
      if (telefon !== undefined && telefon !== null && telefon !== '') {
        userUpdates.telefon = telefon;
      }
      // Only update email if provided and not empty
      if (email !== undefined && email && email.trim() !== '') {
        userUpdates.email = email.trim();
      }
      if (status !== undefined) userUpdates.status = status;
      if (password !== undefined && password && password.trim() !== '') {
        // Hash password if provided
        const bcrypt = (await import('bcryptjs')).default;
        userUpdates.password = await bcrypt.hash(password, 12);
      }

      if (Object.keys(userUpdates).length > 0) {
        const userFields = Object.keys(userUpdates);
        const userValues = Object.values(userUpdates);
        const userSetClause = userFields.map(field => `${field} = ?`).join(', ');
        
        await connection.execute(
          `UPDATE users SET ${userSetClause} WHERE ic = ?`,
          [...userValues, ic]
        );
      }

      // Update teachers table if kepakaran is provided
      if (kepakaran !== undefined) {
        await connection.execute(
          `UPDATE teachers SET kepakaran = ? WHERE user_ic = ?`,
          [JSON.stringify(kepakaran), ic]
        );
      }

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

/**
 * Public teacher registration function
 * Allows teachers to register themselves without authentication
 * Sets status to 'pending' - requires admin approval
 */
export const registerTeacher = async (req, res) => {
  try {
    // Ensure this route skips authentication (set flag if not already set)
    req.skipAuth = true;
    console.log('Teacher registration request received:', { 
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      body: Object.keys(req.body || {})
    });
    
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
      // Check if user already exists by IC
      const [existingUsers] = await connection.execute(
        "SELECT ic, nama, role, status FROM users WHERE ic = ?",
        [ic]
      );

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const [existingTeacherRoles] = await connection.execute(
          'SELECT id FROM user_roles WHERE user_ic = ? AND role = ?',
          [ic, 'teacher']
        );

        if (existingUser.role === 'teacher' || existingTeacherRoles.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Nombor IC ini sudah didaftarkan sebagai guru. Sila log masuk atau hubungi pentadbir jika anda memerlukan bantuan.'
          });
        }
        // Otherwise allow multi-role flow to proceed
      }

      // Check if email already exists (if provided)
      if (emailValue) {
        const [existingEmails] = await connection.execute(
          "SELECT ic, nama, role FROM users WHERE email = ?",
          [emailValue]
        );

        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk dengan akaun yang sedia ada.'
          });
        }
      }

      // Validate password is provided and meets requirements
      if (!password || password.trim() === '') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Kata laluan diperlukan untuk pendaftaran guru.'
        });
      }

      if (password.length < 5) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Kata laluan mestilah sekurang-kurangnya 5 aksara.'
        });
      }

      // Validate kepakaran is provided and is an array
      if (!kepakaran || !Array.isArray(kepakaran) || kepakaran.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Sila pilih sekurang-kurangnya satu kepakaran.'
        });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);

      if (existingUsers && existingUsers.length > 0) {
        const updateFields = ['nama = ?', 'password = ?'];
        const updateParams = [nama.trim(), hashedPassword];

        if (typeof email !== 'undefined') {
          updateFields.push('email = ?');
          updateParams.push(emailValue);
        }

        if (telefon && telefon.trim() !== '') {
          updateFields.push('telefon = ?');
          updateParams.push(telefon.trim());
        }

        await connection.execute(
          `
            UPDATE users
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE ic = ?
          `,
          [...updateParams, ic]
        );

        await connection.execute(
          'INSERT INTO user_roles (user_ic, role) VALUES (?, ?)',
          [ic, 'teacher']
        );

        await connection.execute(
          `INSERT INTO teachers (user_ic, kepakaran) 
           VALUES (?, ?)`,
          [ic, JSON.stringify(kepakaran)]
        );

        await connection.commit();

        const [newTeacher] = await pool.execute(`
          SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at
          FROM users u
          JOIN teachers t ON u.ic = t.user_ic
          WHERE u.ic = ?
        `, [ic]);

        const teacherData = {
          ...newTeacher[0],
          kepakaran: typeof newTeacher[0].kepakaran === 'string' 
            ? JSON.parse(newTeacher[0].kepakaran) 
            : newTeacher[0].kepakaran
        };

        return res.status(201).json({
          success: true,
          message: 'Peranan guru telah ditambahkan kepada akaun sedia ada. Permohonan anda sedang menunggu kelulusan pentadbir.',
          data: teacherData
        });
      }

      // Insert into users table
      // Email is optional, status is always 'pending' for public registration
      
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'teacher', 'pending')`,
        [ic, nama.trim(), telefon || null, emailValue, hashedPassword]
      );

      // Insert into teachers table
      await connection.execute(
        `INSERT INTO teachers (user_ic, kepakaran) 
         VALUES (?, ?)`,
        [ic, JSON.stringify(kepakaran)]
      );

      await connection.commit();

      // Fetch the newly created teacher (without password)
      const [newTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);
      
      const teacherData = {
        ...newTeacher[0],
        kepakaran: typeof newTeacher[0].kepakaran === 'string' 
          ? JSON.parse(newTeacher[0].kepakaran) 
          : newTeacher[0].kepakaran
      };

      console.log('Teacher registered successfully:', { ic, nama, status: 'pending' });

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berjaya! Permohonan anda sedang menunggu kelulusan daripada pentadbir. Anda akan dimaklumkan selepas kelulusan.',
        data: teacherData
      });
    } catch (error) {
      await connection.rollback();
      console.error('Register teacher error:', error);
      
      // Handle duplicate entry errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) {
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain.'
          });
        }
        if (error.sqlMessage.includes('PRIMARY')) {
          return res.status(400).json({
            success: false,
            message: 'Nombor IC ini sudah didaftarkan. Sila log masuk atau gunakan nombor IC lain.'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.'
    });
  }
};
