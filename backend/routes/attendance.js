import express from 'express';
import { body, param } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  bulkMarkAttendanceWithProof,
  getAttendanceStats,
  getStudentAttendanceHistory,
  deleteAttendance,
  confirmAttendanceDocument
} from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { uploadAttendanceProof } from '../middleware/upload.js';
import { requirePicApproval } from '../middleware/picApproval.js';
import { pool } from '../config/database.js';
// Import service to register approval handlers
import '../services/attendanceService.js';

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

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:student_ic', icValidation, normalizeICMiddleware, getStudentAttendanceHistory);
router.post(
  '/',
  requireRole(['admin', 'staff', 'teacher', 'pic']),
  attendanceValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:create',
    entityType: 'attendance',
    message: 'Permintaan kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { student_ic, class_id, tarikh } = req.body;
      // Try to find existing attendance to determine if this is create or update
      const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
      const [existing] = await pool.execute(
        'SELECT id, status FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
        [student_ic, class_id, attendanceDate]
      );
      return {
        entityId: existing.length > 0 ? existing[0].id.toString() : null,
        metadata: {
          summary: existing.length > 0 
            ? `Kemaskini kehadiran untuk ${student_ic}` 
            : `Tambah kehadiran untuk ${student_ic}`,
          student_ic,
          class_id,
          tarikh: attendanceDate,
          current_status: existing.length > 0 ? existing[0].status : null
        }
      };
    }
  }),
  markAttendance
);
router.post('/bulk', requireRole(['admin', 'staff', 'teacher', 'pic']), bulkAttendanceValidation, normalizeICMiddleware, bulkMarkAttendance);
router.post('/bulk-with-proof', requireRole(['admin', 'staff', 'teacher', 'pic']), uploadAttendanceProof, normalizeICMiddleware, bulkMarkAttendanceWithProof);
router.put(
  '/:id',
  requireRole(['admin', 'pic']),
  idValidation,
  attendanceValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:update',
    entityType: 'attendance',
    message: 'Permintaan kemaskini kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { id } = req.params;
      const [existing] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        const error = new Error('Attendance record not found');
        error.status = 404;
        throw error;
      }
      return {
        entityId: id,
        metadata: {
          summary: `Kemaskini kehadiran ID ${id}`,
          current: existing[0],
          requested: req.body
        }
      };
    }
  }),
  markAttendance
);
router.delete(
  '/:id',
  requireRole(['admin', 'pic']),
  idValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:delete',
    entityType: 'attendance',
    message: 'Permintaan padam kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { id } = req.params;
      const [existing] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        const error = new Error('Attendance record not found');
        error.status = 404;
        throw error;
      }
      return {
        entityId: id,
        metadata: {
          summary: `Padam kehadiran ID ${id}`,
          current: existing[0]
        }
      };
    }
  }),
  deleteAttendance
);
router.post('/:id/confirm-document', requireRole(['admin', 'pic', 'ib']), idValidation, confirmAttendanceDocument);

export default router;
