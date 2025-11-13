import express from 'express';
import { body, param } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  bulkMarkAttendanceWithProof,
  getAttendanceStats,
  getStudentAttendanceHistory
} from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { uploadAttendanceProof } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const attendanceValidation = [
  body('student_ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('Student IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
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
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('Student IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('attendance_data.*.status')
    .isIn(['Hadir', 'Tidak Hadir', 'Cuti'])
    .withMessage('Status must be one of: Hadir, Tidak Hadir, Cuti'),
];

const icValidation = [
  param('student_ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    })
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:student_ic', icValidation, normalizeICMiddleware, getStudentAttendanceHistory);
router.post('/', requireRole(['admin', 'staff', 'teacher']), attendanceValidation, normalizeICMiddleware, markAttendance);
router.post('/bulk', requireRole(['admin', 'staff', 'teacher']), bulkAttendanceValidation, normalizeICMiddleware, bulkMarkAttendance);
router.post('/bulk-with-proof', requireRole(['admin', 'staff', 'teacher']), uploadAttendanceProof, normalizeICMiddleware, bulkMarkAttendanceWithProof);

export default router;
