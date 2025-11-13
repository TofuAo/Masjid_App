import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
} from '../controllers/studentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';
import { requirePicApproval } from '../middleware/picApproval.js';
import { pool } from '../config/database.js';

const normalizeIcForQuery = (value) => (typeof value === 'string' ? value.replace(/-/g, '') : value);

const router = express.Router();

// Validation rules
const studentValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('ic')
    .notEmpty()
    .withMessage('IC number is required')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('umur')
    .isInt({ min: 5, max: 100 })
    .withMessage('Age must be between 5 and 100'),
  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 atau 0123456789)');
      }
      return true;
    }),
  body('kelas_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Allow null, undefined, empty string, or valid integer
      if (value === null || value === undefined || value === '') {
        return true;
      }
      return Number.isInteger(Number(value));
    })
    .withMessage('Class ID must be a valid integer or empty'),
  body('status')
    .isIn(['aktif', 'tidak_aktif', 'cuti'])
    .withMessage('Status must be one of: aktif, tidak_aktif, cuti'),
  body('tarikh_daftar')
    .isISO8601()
    .withMessage('Registration date must be a valid date'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long')
];

const icValidation = [
  param('ic')
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
router.get('/', getAllStudents);
router.get('/stats', getStudentStats);
router.get('/:ic', icValidation, normalizeICMiddleware, getStudentById);
router.post(
  '/',
  requireRole(['admin', 'staff', 'pic']),
  studentValidation,
  normalizeICMiddleware,
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:create',
    entityType: 'student',
    message: 'Permintaan menambah pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => ({
      metadata: {
        summary: `Tambah pelajar ${req.body?.nama || ''}`,
        nama: req.body?.nama,
        ic: req.body?.ic
      }
    })
  }),
  createStudent
);
router.put(
  '/:ic',
  requireRole(['admin', 'staff', 'pic']),
  icValidation,
  studentValidation,
  normalizeICMiddleware,
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:update',
    entityType: 'student',
    message: 'Permintaan kemaskini pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const cleanedIc = normalizeIcForQuery(req.params.ic);
      const [rows] = await pool.execute(
        `SELECT u.ic, u.nama, u.email, u.telefon, u.status, s.kelas_id, s.tarikh_daftar
         FROM users u
         JOIN students s ON u.ic = s.user_ic
         WHERE REPLACE(u.ic, '-', '') = ?`,
        [cleanedIc]
      );
      if (rows.length === 0) {
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }
      return {
        entityId: cleanedIc,
        metadata: {
          summary: `Kemaskini pelajar ${rows[0].nama}`,
          current: rows[0],
          requested: {
            ...req.body,
            ic: normalizeIcForQuery(req.body?.ic || cleanedIc)
          }
        }
      };
    }
  }),
  updateStudent
);
router.delete(
  '/:ic',
  requireRole(['admin', 'pic']),
  icValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'students:delete',
    entityType: 'student',
    message: 'Permintaan padam pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const cleanedIc = normalizeIcForQuery(req.params.ic);
      const [rows] = await pool.execute(
        `SELECT u.ic, u.nama, u.email, u.telefon, u.status, s.kelas_id, s.tarikh_daftar
         FROM users u
         JOIN students s ON u.ic = s.user_ic
         WHERE REPLACE(u.ic, '-', '') = ?`,
        [cleanedIc]
      );
      if (rows.length === 0) {
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }
      return {
        entityId: cleanedIc,
        metadata: {
          summary: `Padam pelajar ${rows[0].nama}`,
          current: rows[0]
        }
      };
    }
  }),
  deleteStudent
);

export default router;
