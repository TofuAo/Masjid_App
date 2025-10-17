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
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('IC must be in format: 123456-78-9012'),
  body('telefon')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^01[0-9]-\d{7,8}$/)
    .withMessage('Phone must be in format: 012-3456789'),
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
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('IC must be in format: 123456-78-9012')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAllTeachers);
router.get('/stats', getTeacherStats);
router.get('/:ic', icValidation, getTeacherById);
router.post('/', requireRole(['admin', 'staff']), teacherValidation, createTeacher);
router.put('/:ic', requireRole(['admin', 'staff']), icValidation, teacherValidation, updateTeacher);
router.delete('/:ic', requireRole(['admin']), icValidation, deleteTeacher);

export default router;
