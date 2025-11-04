import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStats
} from '../controllers/teacherController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';

const router = express.Router();

// Validation rules
const teacherValidation = [
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
  body('telefon')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 or 0123456789)');
      }
      return true;
    }),
  body('kepakaran')
    .isArray({ min: 1 })
    .withMessage('At least one expertise is required'),
  body('kepakaran.*')
    .isIn(['Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'])
    .withMessage('Invalid expertise selected'),
  body('status')
    .isIn(['aktif', 'tidak_aktif', 'cuti'])
    .withMessage('Status must be one of: aktif, tidak_aktif, cuti'),
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
router.get('/', getAllTeachers);
router.get('/stats', getTeacherStats);
router.get('/:ic', icValidation, normalizeICMiddleware, getTeacherById);
router.post('/', requireRole(['admin', 'staff']), teacherValidation, normalizeICMiddleware, normalizePhoneMiddleware, createTeacher);
router.put('/:ic', requireRole(['admin', 'staff']), icValidation, teacherValidation, normalizeICMiddleware, normalizePhoneMiddleware, updateTeacher);
router.delete('/:ic', requireRole(['admin']), icValidation, normalizeICMiddleware, deleteTeacher);

export default router;
