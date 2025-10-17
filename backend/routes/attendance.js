import express from 'express';
import { body, param } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceStats,
  getStudentAttendanceHistory
} from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const attendanceValidation = [
  body('student_ic')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('Student IC must be in format: 123456-78-9012'),
  body('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer'),
  body('tarikh')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('status')
    .isIn(['Hadir', 'Tidak Hadir', 'Cuti'])
    .withMessage('Status must be one of: Hadir, Tidak Hadir, Cuti'),
];

const bulkAttendanceValidation = [
  body('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer'),
  body('tarikh')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('attendance_data')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),
  body('attendance_data.*.student_ic')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('Student IC must be in format: 123456-78-9012'),
  body('attendance_data.*.status')
    .isIn(['Hadir', 'Tidak Hadir', 'Cuti'])
    .withMessage('Status must be one of: Hadir, Tidak Hadir, Cuti'),
];

const icValidation = [
  param('student_ic')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('IC must be in format: 123456-78-9012')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:student_ic', icValidation, getStudentAttendanceHistory);
router.post('/', requireRole(['admin', 'staff', 'teacher']), attendanceValidation, markAttendance);
router.post('/bulk', requireRole(['admin', 'staff', 'teacher']), bulkAttendanceValidation, bulkMarkAttendance);

export default router;
