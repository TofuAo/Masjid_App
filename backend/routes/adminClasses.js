import express from 'express';
import { body, param } from 'express-validator';
import {
  getAdminClasses,
  getExamSessions,
  getAdminClassStudents,
  getChangeHistory,
  postAdminChange,
  postAdminRollback
} from '../controllers/adminClassController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Must be before /:classId
router.get('/exam-sessions', requirePermission('class.view'), getExamSessions);
router.get('/change-history', requirePermission('class.view'), getChangeHistory);
router.get('/', requirePermission('class.view'), getAdminClasses);
router.get('/:classId/students', requirePermission('class.view'), getAdminClassStudents);

router.post(
  '/change',
  requirePermission('class.change'),
  [
    body('student_ids').isArray({ min: 1 }).withMessage('student_ids must be a non-empty array'),
    body('from_class_id').isInt({ min: 1 }).withMessage('from_class_id must be a positive integer'),
    body('to_class_id').isInt({ min: 1 }).withMessage('to_class_id must be a positive integer'),
    body('assignment_type').isIn(['permanent', 'exam']).withMessage('assignment_type must be permanent or exam'),
    body('exam_session_id').optional().isInt(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601()
  ],
  postAdminChange
);

router.post(
  '/rollback',
  requirePermission('class.rollback'),
  [
    body('student_ids').isArray({ min: 1 }).withMessage('student_ids must be a non-empty array'),
    body('class_id').optional().isInt(),
    body('exam_session_id').optional().isInt()
  ],
  postAdminRollback
);

export default router;

