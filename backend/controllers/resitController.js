import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

const RESIT_DEADLINE_DAYS = 60;
const RESIT_FEES_BY_TRACK = {
  'Full-Time': 50,
  'Part-Time': 75,
  Online: 40
};
const DEFAULT_RESIT_FEE = 50;
const PASSING_THRESHOLD = 40;

export const getMyResitEligible = async (req, res) => {
  try {
    const studentIc = req.user?.ic || req.user?.userId;
    if (!studentIc) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let rows;
    try {
      const [r] = await pool.execute(
      `SELECT r.id as result_id, r.student_ic, r.exam_id, r.markah, r.gred,
              e.subject as exam_subject, e.tarikh_exam as exam_date,
              ra.status as resit_status, ra.deadline, ra.applied_at, ra.fee_amount, ra.class_track as resit_class_track,
              s.class_track as student_class_track
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       LEFT JOIN students s ON r.student_ic = s.user_ic
       LEFT JOIN resit_applications ra ON ra.result_id = r.id AND ra.student_ic = r.student_ic
       WHERE r.student_ic = ? AND (r.markah IS NOT NULL AND r.markah < ?)
       ORDER BY e.tarikh_exam DESC`,
        [studentIc, PASSING_THRESHOLD]
      );
      rows = r;
    } catch (tableErr) {
      if (tableErr.code === 'ER_NO_SUCH_TABLE' || tableErr.code === 'ER_BAD_FIELD_ERROR') {
        return res.json({ success: true, data: [] });
      }
      throw tableErr;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = rows.map((row) => {
      const examDate = row.exam_date ? new Date(row.exam_date) : null;
      const deadline = row.deadline
        ? new Date(row.deadline)
        : examDate
          ? new Date(examDate.getTime() + RESIT_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
          : null;
      const track = row.resit_class_track || row.student_class_track || 'Full-Time';
      const fee = row.fee_amount != null ? row.fee_amount : (RESIT_FEES_BY_TRACK[track] ?? DEFAULT_RESIT_FEE);
      const status = row.resit_status || 'eligible';
      const deadlinePassed = deadline ? deadline < today : false;

      return {
        result_id: row.result_id,
        exam_id: row.exam_id,
        exam_subject: row.exam_subject,
        exam_date: row.exam_date,
        markah: row.markah,
        gred: row.gred,
        status,
        deadline: deadline ? deadline.toISOString().split('T')[0] : null,
        applied_at: row.applied_at,
        fee_amount: fee,
        class_track: track,
        deadline_passed: deadlinePassed,
        can_apply: status === 'eligible' && !deadlinePassed
      };
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get resit eligible error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const applyResit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentIc = req.user?.ic || req.user?.userId;
    if (!studentIc) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { result_id } = req.body;

    const [results] = await pool.execute(
      `SELECT r.id, r.student_ic, r.markah, e.tarikh_exam
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       WHERE r.id = ? AND r.student_ic = ?`,
      [result_id, studentIc]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found or not yours' });
    }

    const result = results[0];
    if (result.markah >= PASSING_THRESHOLD) {
      return res.status(400).json({ success: false, message: 'Result is passing; resit not applicable' });
    }

    const examDate = result.tarikh_exam ? new Date(result.tarikh_exam) : null;
    const deadline = examDate
      ? new Date(examDate.getTime() + RESIT_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + RESIT_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (deadline < today) {
      return res.status(400).json({ success: false, message: 'Resit application deadline has passed' });
    }

    const [studentRows] = await pool.execute(
      'SELECT class_track FROM students WHERE user_ic = ?',
      [studentIc]
    );
    const track = studentRows[0]?.class_track || 'Full-Time';
    const fee = RESIT_FEES_BY_TRACK[track] ?? DEFAULT_RESIT_FEE;

    const [existing] = await pool.execute(
      'SELECT id, status FROM resit_applications WHERE result_id = ? AND student_ic = ?',
      [result_id, studentIc]
    );

    if (existing.length > 0) {
      if (existing[0].status !== 'eligible') {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this resit'
        });
      }
      await pool.execute(
        `UPDATE resit_applications SET status = 'applied', applied_at = NOW(), deadline = ?, fee_amount = ?, class_track = ?, updated_at = NOW()
         WHERE result_id = ? AND student_ic = ?`,
        [deadline, fee, track, result_id, studentIc]
      );
    } else {
      await pool.execute(
        `INSERT INTO resit_applications (result_id, student_ic, status, deadline, applied_at, fee_amount, class_track)
         VALUES (?, ?, 'applied', ?, NOW(), ?, ?)`,
        [result_id, studentIc, deadline, fee, track]
      );
    }

    res.json({
      success: true,
      message: 'Resit application submitted',
      data: { result_id, status: 'applied', deadline, fee_amount: fee }
    });
  } catch (error) {
    console.error('Apply resit error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
