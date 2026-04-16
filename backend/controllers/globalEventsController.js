import { pool } from '../config/database.js';

/**
 * GET /api/global-events
 * Returns events for a 5-day window (for Hari Konvo date bar).
 * Query: start_date, end_date (defaults to today + 4 days)
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
      end.setDate(end.getDate() + 4);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    const [rows] = await pool.execute(
      `SELECT id, event_date, label, description
       FROM global_events
       WHERE event_date >= ? AND event_date <= ?
       ORDER BY event_date ASC`,
      [startDate, endDate]
    );

    return res.json({
      success: true,
      data: rows,
      range: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Global events list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuatkan acara',
      error: error.message
    });
  }
};
