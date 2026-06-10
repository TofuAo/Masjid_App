import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { getSafePagination } from '../utils/pagination.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

export const getAllExams = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = `SELECT e.*, c.nama_kelas FROM exams e JOIN classes c ON e.class_id = c.id WHERE 1=1`;
    const queryParams = [];

    if (search) {
      query += ` AND subject LIKE ?`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 10);
    query += ` ORDER BY e.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [exams] = await pool.execute(query, queryParams);

    // Use parameterized query for count to prevent SQL injection
    let countQuery = `SELECT COUNT(*) as total FROM exams WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND subject LIKE ?`;
      countParams.push(`%${search}%`);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: exams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all exams error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const [exam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [id]);

    if (exam.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, data: exam[0] });
  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { class_id, subject, tarikh_exam } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO exams (class_id, subject, tarikh_exam) VALUES (?, ?, ?)',
      [class_id, subject, tarikh_exam]
    );

    const [newExam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [result.insertId]);

    // Create snapshot after create (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'exam',
        entityId: result.insertId,
        entityIdentifier: `${subject}-${class_id}`,
        operation: 'create',
        data: newExam[0],
        metadata: {
          title: `Peperiksaan - ${subject}`,
          notes: `Peperiksaan baru ditambah: ${subject} untuk kelas ${class_id}`
        },
        actorPhone
      });
    }

    res.status(201).json({ success: true, message: 'Exam created successfully', data: newExam[0] });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { class_id, subject, tarikh_exam } = req.body;

    const [existingExam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [id]);
    if (existingExam.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const existingData = existingExam[0];
    
    // Create snapshot before update (only for admin/PIC)
    const actorPhone = req.user?.telefon;
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'exam',
        entityId: parseInt(id),
        entityIdentifier: `${existingData.subject}-${existingData.class_id}`,
        operation: 'update',
        data: existingData,
        metadata: {
          title: `Peperiksaan - ${existingData.subject}`,
          notes: `Peperiksaan dikemaskini: ${subject}`
        },
        actorPhone
      });
    }

    await pool.execute(
      'UPDATE exams SET class_id = ?, subject = ?, tarikh_exam = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [class_id, subject, tarikh_exam, id]
    );

    const [updatedExam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [id]);

    res.json({ success: true, message: 'Exam updated successfully', data: updatedExam[0] });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingExam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [id]);
    if (existingExam.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const examData = existingExam[0];
    const actorPhone = req.user?.telefon;
    
    // Create snapshot before delete (only for admin/PIC)
    if (actorPhone && (req.user?.role === 'admin' || req.user?.role === 'pic')) {
      await createSnapshot({
        entityType: 'exam',
        entityId: parseInt(id),
        entityIdentifier: `${examData.subject}-${examData.class_id}`,
        operation: 'delete',
        data: examData,
        metadata: {
          title: `Peperiksaan - ${examData.subject}`,
          notes: `Peperiksaan dipadam: ${examData.subject}`
        },
        actorPhone
      });
    }

    await pool.execute('DELETE FROM exams WHERE id = ?', [id]);

    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
