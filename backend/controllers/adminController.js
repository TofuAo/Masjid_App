import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { formatICWithHyphen } from '../utils/icFormatter.js';
import { ensureSingleIb } from '../middleware/ensureSingleIb.js';

export const getAllAdmins = async (req, res) => {
  try {
    const { search, status, page = 1, limit } = req.query;
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    let query = `
      SELECT ic, nama, email, telefon, status, created_at, updated_at
      FROM users
      WHERE role = 'admin'
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (nama LIKE ? OR ic LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND status = ?`;
      queryParams.push(status);
    }
    
    const safeLimit = Math.max(1, defaultLimit);
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [admins] = await pool.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE role = 'admin'
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (nama LIKE ? OR ic LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Get current admin count for limit checking
    const [adminCountResult] = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );
    const currentAdminCount = adminCountResult[0].count;
    
    // Format admins data
    const formattedAdmins = admins.map(admin => ({
      ...admin,
      IC: admin.ic, // Add uppercase IC for frontend compatibility
      ic_formatted: formatICWithHyphen(admin.ic)
    }));

    res.json({
      success: true,
      data: formattedAdmins,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      },
      adminLimit: {
        max: 5,
        current: currentAdminCount,
        canCreate: currentAdminCount < 5
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { ic } = req.params;
    
    const [admins] = await pool.execute(
      'SELECT ic, nama, email, telefon, status, created_at, updated_at FROM users WHERE ic = ? AND role = ?',
      [ic, 'admin']
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const admin = admins[0];
    admin.IC = admin.ic;
    admin.ic_formatted = formatICWithHyphen(admin.ic);

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    console.log('Creating admin with data:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, telefon, email, password, status } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check current admin count (limit to 5 admins)
      const [adminCountResult] = await connection.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );
      const currentAdminCount = adminCountResult[0].count;

      if (currentAdminCount >= 5) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Bilangan admin telah mencapai had maksimum (5 admin). Sila padamkan admin sedia ada sebelum menambah admin baharu.'
        });
      }

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
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert into users table with admin role
      const emailValue = email && email.trim() !== '' ? email.trim() : null;
      const adminStatus = status || 'aktif'; // Default to 'aktif' if not provided
      
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'admin', ?)`,
        [ic, nama, telefon, emailValue, hashedPassword, adminStatus]
      );

      await connection.commit();

      const [newAdmin] = await pool.execute(
        `SELECT ic, nama, email, telefon, status, created_at, updated_at
         FROM users
         WHERE ic = ?`,
        [ic]
      );
      
      const admin = newAdmin[0];
      admin.IC = admin.ic;
      admin.ic_formatted = formatICWithHyphen(admin.ic);
      
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateAdmin = async (req, res) => {
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
    const { nama, telefon, email, password, status, role } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if admin exists (either as admin or pic if role is being changed)
      const [existingUsers] = await connection.execute(
        'SELECT * FROM users WHERE ic = ?',
        [ic]
      );

      if (existingUsers.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Admin tidak ditemui.'
        });
      }

      const existingUser = existingUsers[0];
      
      // If user is not currently an admin and we're not changing role to pic, return error
      if (existingUser.role !== 'admin' && !(role === 'pic' && existingUser.role === 'admin')) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Admin tidak ditemui.'
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email.trim() !== '') {
        const [existingEmails] = await connection.execute(
          'SELECT * FROM users WHERE email = ? AND ic != ?',
          [email.trim(), ic]
        );

        if (existingEmails.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain.'
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (nama) {
        updateFields.push('nama = ?');
        updateValues.push(nama);
      }

      if (telefon) {
        updateFields.push('telefon = ?');
        updateValues.push(telefon);
      }

      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email && email.trim() !== '' ? email.trim() : null);
      }

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      // Allow role to be updated if it's 'pic' (downgrade from admin to pic) or 'ib'
      if (role !== undefined && (role === 'pic' || role === 'ib')) {
        // If assigning IB role, ensure only one IB user exists
        if (role === 'ib') {
          await ensureSingleIb(ic);
        }
        updateFields.push('role = ?');
        updateValues.push(role);
      }

      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(ic);

      // If role is being changed, don't filter by role in WHERE clause
      const whereClause = role && role === 'pic' && existingUser.role === 'admin'
        ? 'WHERE ic = ?'
        : 'WHERE ic = ? AND role = ?';

      if (role && role === 'pic' && existingUser.role === 'admin') {
        // Role is being changed, don't filter by role
      } else {
        updateValues.push('admin');
      }

      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} ${whereClause}`,
        updateValues
      );

      await connection.commit();

      // Get updated user (could be admin or pic now)
      const [updatedUser] = await pool.execute(
        'SELECT ic, nama, email, telefon, status, role, created_at, updated_at FROM users WHERE ic = ?',
        [ic]
      );

      const user = updatedUser[0];
      user.IC = user.ic;
      user.ic_formatted = formatICWithHyphen(user.ic);

      const successMessage = role === 'pic' && existingUser.role === 'admin'
        ? 'Admin berjaya ditukar kepada PIC.'
        : 'Admin berjaya dikemaskini.';

      res.json({
        success: true,
        message: successMessage,
        data: user
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { ic } = req.params;

    // Prevent deleting yourself
    if (req.user && req.user.ic === ic) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if admin exists
      const [existingAdmins] = await connection.execute(
        'SELECT * FROM users WHERE ic = ? AND role = ?',
        [ic, 'admin']
      );

      if (existingAdmins.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Delete admin (CASCADE will handle related data if any)
      await connection.execute(
        'DELETE FROM users WHERE ic = ? AND role = ?',
        [ic, 'admin']
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Admin deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Delete admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

