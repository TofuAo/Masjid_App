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
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('telefon')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 or 0123456789)');
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
router.post('/', requireRole(['admin', 'staff']), studentValidation, normalizeICMiddleware, normalizePhoneMiddleware, createStudent);
router.put('/:ic', requireRole(['admin', 'staff']), icValidation, studentValidation, normalizeICMiddleware, normalizePhoneMiddleware, updateStudent);
router.delete('/:ic', requireRole(['admin']), icValidation, normalizeICMiddleware, deleteStudent);

export default router;
