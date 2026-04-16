import { pool } from '../config/database.js';

/**
 * List memo entries for a date range (14-day view for Global Header)
 * Query: start_date, end_date (defaults to today + 13 days)
 */
export const list = async (req, res) => {
  try {
    let startDate = req.query.start_date;
    let endDate = req.query.end_date;

    if (!startDate || !endDate) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate());
      const end = new Date(today);
      end.setDate(end.getDate() + 13);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    const [rows] = await pool.execute(
      `SELECT id, start_date, end_date, content, created_at
       FROM memo_entries
       WHERE end_date >= ? AND start_date <= ?
       ORDER BY start_date ASC`,
      [startDate, endDate]
    );

    return res.json({
      success: true,
      data: rows,
      range: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Memo list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuatkan memo',
      error: error.message
    });
  }
};

/**
 * Create memo entry. Admin/PIC only.
 */
export const create = async (req, res) => {
  try {
    const { start_date, end_date, content } = req.body;
    const user = req.user;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Tarikh mula dan tamat diperlukan' });
    }

    const [result] = await pool.execute(
      `INSERT INTO memo_entries (start_date, end_date, content, created_by_ic)
       VALUES (?, ?, ?, ?)`,
      [start_date, end_date, content?.trim() || null, user?.ic]
    );

    const [rows] = await pool.execute('SELECT * FROM memo_entries WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Memo berjaya ditambah'
    });
  } catch (error) {
    console.error('Memo create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan memo',
      error: error.message
    });
  }
};

/**
 * Update memo entry.
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, content } = req.body;

    await pool.execute(
      `UPDATE memo_entries SET start_date = ?, end_date = ?, content = ?
       WHERE id = ?`,
      [start_date, end_date, content?.trim() || null, id]
    );

    const [rows] = await pool.execute('SELECT * FROM memo_entries WHERE id = ?', [id]);
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Memo update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengemaskini memo',
      error: error.message
    });
  }
};

/**
 * Delete memo entry.
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM memo_entries WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Memo dipadam' });
  } catch (error) {
    console.error('Memo delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memadam memo',
      error: error.message
    });
  }
};
