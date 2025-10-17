import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStats
} from '../controllers/classController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const classValidation = [
  body('nama_kelas')
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Class name must be between 2 and 100 characters'),
  body('jadual')
    .notEmpty()
    .withMessage('Schedule is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Schedule must be between 2 and 100 characters'),
  body('guru_ic')
    .notEmpty()
    .withMessage('Teacher IC is required')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('Teacher IC must be in format: 123456-78-9012'),
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAllClasses);
router.get('/stats', getClassStats);
router.get('/:id', idValidation, getClassById);
router.post('/', requireRole(['admin', 'staff']), classValidation, createClass);
router.put('/:id', requireRole(['admin', 'staff']), idValidation, classValidation, updateClass);
router.delete('/:id', requireRole(['admin']), idValidation, deleteClass);

export default router;
