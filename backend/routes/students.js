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
import { fetchStudentByIc } from '../services/studentService.js';

const normalizeIcForQuery = (value) => (typeof value === 'string' ? value.replace(/-/g, '') : value);

const router = express.Router();

// Validation rules for creating students
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
    .optional()
    .isIn(['aktif', 'tidak_aktif'])
    .withMessage('Status must be one of: aktif, tidak_aktif'),
  body('tarikh_daftar')
    .isISO8601()
    .withMessage('Registration date must be a valid date'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long')
];

// Validation rules for updating students (all fields optional except password validation if provided)
const studentUpdateValidation = [
  body('nama')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('ic')
    .optional()
    .custom((value) => {
      if (value && !isValidICFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('umur')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Age must be between 5 and 100'),
  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value && !isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 atau 0123456789)');
      }
      return true;
    }),
  body('kelas_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      return Number.isInteger(Number(value));
    })
    .withMessage('Class ID must be a valid integer or empty'),
  // Status validation removed - status field no longer in form
  body('tarikh_daftar')
    .optional()
    .isISO8601()
    .withMessage('Registration date must be a valid date'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Allow empty string, null, or undefined
      if (!value || value.trim() === '') {
        return true;
      }
      // If provided, must be valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Must be a valid email');
      }
      return true;
    })
    .withMessage('Must be a valid email'),
  // Password validation removed from update route - handled in controller
  // Password is optional for updates and will only be validated if provided
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
  studentUpdateValidation,
  normalizeICMiddleware,
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:update',
    entityType: 'student',
    message: 'Permintaan kemaskini pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      console.log('requirePicApproval prepare: IC from params:', req.params.ic);
      // Use the same fetchStudentByIc function to ensure consistency
      // IC in params might be normalized by normalizeICMiddleware, but we'll handle all formats
      let student = await fetchStudentByIc(req.params.ic);
      
      // If not found, try with original IC before normalization
      if (!student && req.params.ic) {
        // Try with cleaned version
        const cleanedIc = normalizeIcForQuery(req.params.ic);
        if (cleanedIc !== req.params.ic) {
          student = await fetchStudentByIc(cleanedIc);
        }
      }
      
      // If still not found, try with normalized format
      if (!student && req.params.ic) {
        const cleanedIc = normalizeIcForQuery(req.params.ic);
        if (cleanedIc.length === 12) {
          const normalizedIc = `${cleanedIc.substring(0, 6)}-${cleanedIc.substring(6, 8)}-${cleanedIc.substring(8, 12)}`;
          if (normalizedIc !== req.params.ic) {
            student = await fetchStudentByIc(normalizedIc);
          }
        }
      }
      
      if (!student) {
        console.error('requirePicApproval: Student not found after all attempts. IC:', req.params.ic);
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }
      
      console.log('requirePicApproval: Found student:', student.ic, student.nama);
      const cleanedIc = normalizeIcForQuery(student.ic || req.params.ic);
      
      return {
        entityId: cleanedIc,
        metadata: {
          summary: `Kemaskini pelajar ${student.nama}`,
          current: student,
          requested: {
            ...req.body,
            ic: normalizeIcForQuery(req.body?.ic || student.ic || cleanedIc)
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
  // Store original IC before normalization middleware (for special IDs)
  (req, res, next) => {
    req.originalIc = req.params.ic;
    next();
  },
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'students:delete',
    entityType: 'student',
    message: 'Permintaan padam pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      // Use original IC if normalizeIC returned null (for special IDs like SPUTERIZULAIQHA001)
      const ic = req.params.ic || req.originalIc;
      if (!ic) {
        const error = new Error('IC pelajar diperlukan.');
        error.status = 400;
        throw error;
      }
      
      const cleanedIc = normalizeIcForQuery(ic);
      console.log('[PIC Delete Prepare] Looking up student with IC:', ic, 'cleaned:', cleanedIc);
      
      // Try multiple lookup strategies to handle both standard ICs and special student IDs
      // Strategy 1: Direct match (for special IDs like SSITIHAWA001, SPUTERIZULAIQHA001)
      let [rows] = await pool.execute(
        `SELECT u.ic, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
         FROM users u
         LEFT JOIN students s ON u.ic = s.user_ic
         WHERE u.ic = ? AND u.role = 'student'`,
        [ic]
      );
      console.log('[PIC Delete Prepare] Strategy 1 (direct match) found:', rows.length, 'rows');
      
      // Strategy 2: If not found, try with cleaned IC (remove hyphens) - only for standard ICs
      if (rows.length === 0 && cleanedIc !== ic && cleanedIc.length === 12) {
        [rows] = await pool.execute(
          `SELECT u.ic, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.ic = s.user_ic
           WHERE REPLACE(u.ic, '-', '') = ? AND u.role = 'student'`,
          [cleanedIc]
        );
        console.log('[PIC Delete Prepare] Strategy 2 (cleaned IC) found:', rows.length, 'rows');
      }
      
      // Strategy 3: Try case-insensitive match (for special IDs and case variations)
      if (rows.length === 0) {
        [rows] = await pool.execute(
          `SELECT u.ic, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.ic = s.user_ic
           WHERE UPPER(u.ic) = UPPER(?) AND u.role = 'student'`,
          [ic]
        );
        console.log('[PIC Delete Prepare] Strategy 3 (case-insensitive) found:', rows.length, 'rows');
      }
      
      // Strategy 4: Try exact match with original IC from URL (in case of encoding issues)
      if (rows.length === 0 && req.originalIc && req.originalIc !== ic) {
        [rows] = await pool.execute(
          `SELECT u.ic, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.ic = s.user_ic
           WHERE u.ic = ? AND u.role = 'student'`,
          [req.originalIc]
        );
        console.log('[PIC Delete Prepare] Strategy 4 (original IC) found:', rows.length, 'rows');
      }
      
      if (rows.length === 0) {
        console.error('[PIC Delete Prepare] Student not found after all strategies. IC:', ic, 'originalIc:', req.originalIc);
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }
      
      console.log('[PIC Delete Prepare] Found student:', rows[0].ic, rows[0].nama);
      return {
        entityId: rows[0].ic, // Use the actual IC from database
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
