import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { formatICWithHyphen } from '../utils/icFormatter.js';

const PIC_ROLE = 'pic';

const mapPicUser = (row) => ({
  ic: row.ic,
  ic_formatted: formatICWithHyphen(row.ic),
  nama: row.nama,
  email: row.email,
  telefon: row.telefon,
  status: row.status,
  role: row.role,
  created_at: row.created_at,
  updated_at: row.updated_at
});

export const listPicUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = `
      SELECT ic, nama, email, telefon, status, role, created_at, updated_at
      FROM users
      WHERE role = ?
    `;
    const params = [PIC_ROLE];

    if (search) {
      const like = `%${search.trim()}%`;
      const icLike = `%${search.trim().replace(/\D/g, '')}%`;
      query += ` AND (nama LIKE ? OR ic LIKE ? OR email LIKE ?)`;
      params.push(like, icLike, like);
    }

    query += ' ORDER BY nama ASC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows.map(mapPicUser)
    });
  } catch (error) {
    console.error('List PIC users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createPicUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, email, telefon, password, status = 'aktif' } = req.body;

    const [existingByIc] = await pool.execute(
      'SELECT ic FROM users WHERE ic = ?',
      [ic]
    );

    if (existingByIc.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'IC ini telah digunakan oleh pengguna lain.'
      });
    }

    if (email) {
      const [existingByEmail] = await pool.execute(
        'SELECT ic FROM users WHERE email = ?',
        [email]
      );

      if (existingByEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini telah digunakan oleh pengguna lain.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users (ic, nama, email, telefon, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ic, nama, email || null, telefon || null, hashedPassword, PIC_ROLE, status]
    );

    const [createdRows] = await pool.execute(
      `SELECT ic, nama, email, telefon, status, role, created_at, updated_at
       FROM users
       WHERE ic = ?`,
      [ic]
    );

    res.status(201).json({
      success: true,
      message: 'PIC baharu berjaya ditambah.',
      data: mapPicUser(createdRows[0])
    });
  } catch (error) {
    console.error('Create PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePicUser = async (req, res) => {
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
    const { nama, email, telefon, password, status } = req.body;

    const [existingRows] = await pool.execute(
      `SELECT * FROM users WHERE ic = ? AND role = ?`,
      [ic, PIC_ROLE]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PIC tidak ditemui.'
      });
    }

    if (email) {
      const [emailConflicts] = await pool.execute(
        `SELECT ic FROM users WHERE email = ? AND ic <> ?`,
        [email, ic]
      );

      if (emailConflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini telah digunakan oleh pengguna lain.'
        });
      }
    }

    const fields = [];
    const params = [];

    if (nama !== undefined) {
      fields.push('nama = ?');
      params.push(nama);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email || null);
    }
    if (telefon !== undefined) {
      fields.push('telefon = ?');
      params.push(telefon || null);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      fields.push('password = ?');
      params.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.json({
        success: true,
        message: 'Tiada perubahan dibuat.',
        data: mapPicUser(existingRows[0])
      });
    }

    params.push(ic, PIC_ROLE);

    await pool.execute(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE ic = ? AND role = ?`,
      params
    );

    const [updatedRows] = await pool.execute(
      `SELECT ic, nama, email, telefon, status, role, created_at, updated_at
       FROM users
       WHERE ic = ?`,
      [ic]
    );

    res.json({
      success: true,
      message: 'PIC berjaya dikemaskini.',
      data: mapPicUser(updatedRows[0])
    });
  } catch (error) {
    console.error('Update PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePicUser = async (req, res) => {
  try {
    const { ic } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM users WHERE ic = ? AND role = ?',
      [ic, PIC_ROLE]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'PIC tidak ditemui.'
      });
    }

    res.json({
      success: true,
      message: 'PIC berjaya dipadam.'
    });
  } catch (error) {
    console.error('Delete PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


