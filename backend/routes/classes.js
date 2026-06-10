import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStats,
  getDashboardStats
} from '../controllers/classController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';

const router = express.Router();

// Public route: Dashboard stats only
router.get('/dashboard/stats', getDashboardStats);

// All routes below require authentication
router.use(authenticateToken);

// Validation rules
const classValidation = [
  body('nama_kelas')
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Class name must be between 2 and 100 characters'),
  body('level')
    .notEmpty()
    .withMessage('Level is required')
    .isIn(['Asas', 'Tahsin Asas', 'Pertengahan', 'Lanjutan', 'Tahsin Lanjutan', 'Talaqi'])
    .withMessage('Invalid level selected'),
  body('yuran')
    .isNumeric()
    .withMessage('Fee must be a number')
    .isFloat({ min: 0 })
    .withMessage('Fee must be greater than or equal to 0'),
  body('kapasiti')
    .isInt({ min: 1, max: 50 })
    .withMessage('Capacity must be between 1 and 50'),
  body('guru_telefon')
    .notEmpty()
    .withMessage('Teacher IC is required')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Teacher IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('sessions')
    .isArray({ min: 1 })
    .withMessage('At least one session is required'),
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Protected routes
router.get('/', getAllClasses);
router.get('/stats', getClassStats);
router.get('/:id', idValidation, getClassById);
router.post('/', requireRole(['admin', 'staff']), classValidation, normalizePhoneMiddleware, createClass);
// Allow teachers to update their own classes, admins/staff can update any class
router.put('/:id', idValidation, classValidation, normalizePhoneMiddleware, updateClass);
router.delete('/:id', requireRole(['admin']), idValidation, deleteClass);

export default router;

