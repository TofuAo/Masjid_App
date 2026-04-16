import { validationResult } from 'express-validator';
import * as classManagementService from '../services/classManagementService.js';

/**
 * GET /api/admin/classes — list classes (admin; permission class.view)
 */
export const getAdminClasses = async (req, res) => {
  try {
    const result = await classManagementService.getClasses(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('getAdminClasses error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/classes/change-history — list class change log for Carian Transfer
 */
export const getChangeHistory = async (req, res) => {
  try {
    const data = await classManagementService.getChangeHistory(req.query);
    res.json({ success: true, data });
  } catch (err) {
    console.error('getChangeHistory error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/classes/exam-sessions — list exam sessions for dropdown
 */
export const getExamSessions = async (req, res) => {
  try {
    const data = await classManagementService.getExamSessions();
    res.json({ success: true, data });
  } catch (err) {
    console.error('getExamSessions error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/classes/:classId/students — students in class with current_assignment_type, status
 */
export const getAdminClassStudents = async (req, res) => {
  try {
    const result = await classManagementService.getStudentsByClass(req.params.classId);
    if (!result) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: result.data, class: result.class });
  } catch (err) {
    console.error('getAdminClassStudents error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/admin/classes/change — bulk change class (permission class.change)
 * Body: ChangeClassDto (student_ids, from_class_id, to_class_id, assignment_type, exam_session_id?, start_date?, end_date?)
 */
export const postAdminChange = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const adminIc = req.user?.ic;
    if (!adminIc) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const body = {
      student_ids: req.body.student_ids,
      from_class_id: req.body.from_class_id,
      to_class_id: req.body.to_class_id,
      assignment_type: req.body.assignment_type,
      exam_session_id: req.body.exam_session_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date
    };
    const result = await classManagementService.changeClass(body, adminIc);
    res.json({
      success: true,
      message: result.type === 'permanent' ? 'Class changed permanently.' : 'Exam class assignment saved.',
      updated: result.updated
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message, missing: err.missing });
    }
    console.error('postAdminChange error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

/**
 * POST /api/admin/classes/rollback — rollback exam assignment (permission class.rollback)
 * Body: { student_ids: [], class_id?, exam_session_id? }
 */
export const postAdminRollback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const adminIc = req.user?.ic;
    if (!adminIc) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await classManagementService.rollbackClass(req.body, adminIc);
    res.json({ success: true, message: 'Rollback completed.', updated: result.updated });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('postAdminRollback error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

/**
 * GET /api/admin/students/:id/history — class change history for student (id = IC)
 */
export const getAdminStudentHistory = async (req, res) => {
  try {
    const data = await classManagementService.getStudentHistory(req.params.id);
    if (!data) return res.status(400).json({ success: false, message: 'Student id (IC) required' });
    res.json({ success: true, data });
  } catch (err) {
    console.error('getAdminStudentHistory error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
