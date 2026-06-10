import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  registerTeacher,
  getUnassignedStaffTeachers,
  convertUserToTeacher
} from '../controllers/teacherController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';

const router = express.Router();

// Middleware to remove status field from request body (status is set automatically by controller)
const removeStatusMiddleware = (req, res, next) => {
  if (req.body && req.body.status !== undefined) {
    delete req.body.status;
  }
  next();
};

// IMPORTANT: Register route MUST be defined first, before any middleware
// This ensures Express matches the route handler before applying middleware

// Validation rules for public teacher registration (no auth required)
export const registerTeacherValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('telefon')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value && !isValidPhoneFormat(value)) {
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
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided
      if (value !== undefined && value !== null && value !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required for teacher registration')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long')
];

// Validation rules for creating teacher (password required, authenticated admin/teacher only)
const createTeacherValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
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
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided
      if (value !== undefined && value !== null && value !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required for new teachers')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 chars long')
];

// Validation rules for updating teacher (password and email optional, IC required)
const updateTeacherValidation = [
  body('nama')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('telefon')
    .optional()
    .custom((value) => {
      if (value && !isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 or 0123456789)');
      }
      return true;
    }),
  body('kepakaran')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one expertise is required'),
  body('kepakaran.*')
    .optional()
    .isIn(['Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'])
    .withMessage('Invalid expertise selected'),
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided
      if (value !== undefined && value !== null && value !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
      }
      return true;
    }),
  body('password')
    .optional()
    .custom((value) => {
      // Only validate if password is provided
      if (value !== undefined && value !== null && value !== '') {
        if (String(value).trim().length < 5) {
          throw new Error('Password must be at least 5 chars long');
        }
      }
      return true;
    })
];

const icValidation = [
  param('ic')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    })
];

// PUBLIC ROUTE: Teacher registration (NO AUTH REQUIRED)
// MUST be defined FIRST before any auth middleware
// Add explicit middleware to mark this as a public route
router.post('/register', (req, res, next) => {
  // Explicitly mark this route as public - set flag BEFORE any other middleware
  req.skipAuth = true;
  req._skipAuthForTeacherRegister = true;
  console.log('✅ Teacher registration route matched - setting skipAuth flags');
  next();
}, registerTeacherValidation, normalizePhoneMiddleware, normalizePhoneMiddleware, registerTeacher);

// Routes - Apply authentication to each route individually (NOT using router.use to avoid affecting /register)
router.get('/', authenticateToken, getAllTeachers);
router.get('/stats', authenticateToken, getTeacherStats);
router.get('/unassigned', authenticateToken, requireRole(['admin']), getUnassignedStaffTeachers);
router.post('/convert', authenticateToken, requireRole(['admin']), [
  body('telefon').notEmpty().withMessage('Nombor telefon diperlukan'),
  body('kepakaran').optional().isArray().withMessage('Kepakaran must be an array')
], normalizePhoneMiddleware, convertUserToTeacher);
router.get('/:ic', authenticateToken, icValidation, normalizePhoneMiddleware, getTeacherById);
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), removeStatusMiddleware, createTeacherValidation, normalizePhoneMiddleware, normalizePhoneMiddleware, createTeacher);
router.put('/:ic', authenticateToken, requireRole(['admin', 'teacher']), icValidation, updateTeacherValidation, normalizePhoneMiddleware, normalizePhoneMiddleware, updateTeacher);
router.delete('/:ic', authenticateToken, requireRole(['admin']), icValidation, normalizePhoneMiddleware, deleteTeacher);

export default router;

