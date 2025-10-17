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
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('IC must be in format: 123456-78-9012'),
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
    .matches(/^01[0-9]-\d{7,8}$/)
    .withMessage('Phone must be in format: 012-3456789'),
  body('kelas_id')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Class ID must be a valid integer'),
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
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('IC must be in format: 123456-78-9012')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAllStudents);
router.get('/stats', getStudentStats);
router.get('/:ic', icValidation, getStudentById);
router.post('/', requireRole(['admin', 'staff']), studentValidation, createStudent);
router.put('/:ic', requireRole(['admin', 'staff']), icValidation, studentValidation, updateStudent);
router.delete('/:ic', requireRole(['admin']), icValidation, deleteStudent);

export default router;
