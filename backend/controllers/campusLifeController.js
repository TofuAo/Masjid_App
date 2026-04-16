import { pool } from '../config/database.js';
import { safeLimit, safeOffset } from '../utils/safeQuery.js';

/**
 * List campus life items. Teachers see their own; admins see all.
 * Query: status (pending|approved|rejected), page, limit
 */
export const list = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const user = req.user;
    const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

    let where = [];
    let params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.push('cli.status = ?');
      params.push(status);
    }

    if (category && ['takwim', 'garis_panduan', 'modul', 'fasiliti'].includes(category)) {
      where.push('cli.category = ?');
      params.push(category);
    }

    if (!isAdmin) {
      const ic = user?.ic;
      if (ic == null || ic === '') {
        return res.status(403).json({ success: false, message: 'IC diperlukan untuk melihat rekod' });
      }
      where.push('cli.created_by_ic = ?');
      params.push(ic);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitVal = safeLimit(limit, 20, 1, 100);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = safeOffset((pageNum - 1) * limitVal, 0, 10000);

    const [rows] = await pool.execute(
      `SELECT cli.*, u.nama as created_by_nama
       FROM campus_life_items cli
       LEFT JOIN users u ON u.ic = cli.created_by_ic
       ${whereClause}
       ORDER BY cli.created_at DESC
       LIMIT ${limitVal} OFFSET ${offset}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM campus_life_items cli ${whereClause}`,
      params
    );
    const total = parseInt(countRows[0]?.total || 0, 10);

    return res.json({
      success: true,
      data: rows,
      pagination: { page: pageNum || 1, limit: limitVal, total }
    });
  } catch (error) {
    console.error('Campus life list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuatkan senarai',
      error: error.message
    });
  }
};

/**
 * Create a new campus life item. Teachers and admins.
 */
export const create = async (req, res) => {
  try {
    const { title, details, tarikh, hari, masa, target_role, category } = req.body;
    const user = req.user;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tajuk diperlukan' });
    }

    const tag = target_role && ['pelajar', 'guru', 'pilihan'].includes(String(target_role).toLowerCase())
      ? String(target_role).toLowerCase()
      : null;

    const cat = category && ['takwim', 'garis_panduan', 'modul', 'fasiliti'].includes(String(category).toLowerCase())
      ? String(category).toLowerCase()
      : null;

    const [result] = await pool.execute(
      `INSERT INTO campus_life_items (title, details, tarikh, hari, masa, target_role, category, created_by_ic, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        title.trim(),
        details?.trim() || null,
        tarikh || null,
        hari?.trim() || null,
        masa?.trim() || null,
        tag,
        cat,
        user?.ic
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM campus_life_items WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Rekod berjaya ditambah. Menunggu kelulusan.'
    });
  } catch (error) {
    console.error('Campus life create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan rekod',
      error: error.message
    });
  }
};

/**
 * Get single item by id.
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

    const [rows] = await pool.execute(
      `SELECT cli.*, u.nama as created_by_nama
       FROM campus_life_items cli
       LEFT JOIN users u ON u.ic = cli.created_by_ic
       WHERE cli.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Rekod tidak ditemui' });
    }

    const item = rows[0];
    if (!isAdmin && item.created_by_ic !== user?.ic) {
      return res.status(403).json({ success: false, message: 'Tiada kebenaran' });
    }

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error('Campus life getById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuatkan rekod',
      error: error.message
    });
  }
};

/**
 * Approve item. Admin only.
 */
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const user = req.user;
    const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Hanya pentadbir boleh meluluskan' });
    }

    const [rows] = await pool.execute(
      'SELECT id, status FROM campus_life_items WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Rekod tidak ditemui' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Rekod telah diproses' });
    }

    await pool.execute(
      `UPDATE campus_life_items SET status = 'approved', reviewed_by_ic = ?, reviewed_at = NOW(), notes = ?
       WHERE id = ?`,
      [user.ic, notes?.trim() || null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM campus_life_items WHERE id = ?', [id]);
    return res.json({
      success: true,
      data: updated[0],
      message: 'Rekod diluluskan'
    });
  } catch (error) {
    console.error('Campus life approve error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal meluluskan',
      error: error.message
    });
  }
};

/**
 * Reject item. Admin only.
 */
export const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const user = req.user;
    const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Hanya pentadbir boleh menolak' });
    }

    const [rows] = await pool.execute(
      'SELECT id, status FROM campus_life_items WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Rekod tidak ditemui' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Rekod telah diproses' });
    }

    await pool.execute(
      `UPDATE campus_life_items SET status = 'rejected', reviewed_by_ic = ?, reviewed_at = NOW(), notes = ?
       WHERE id = ?`,
      [user.ic, notes?.trim() || null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM campus_life_items WHERE id = ?', [id]);
    return res.json({
      success: true,
      data: updated[0],
      message: 'Rekod ditolak'
    });
  } catch (error) {
    console.error('Campus life reject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menolak',
      error: error.message
    });
  }
};
