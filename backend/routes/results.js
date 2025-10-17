import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  getResultStats,
  getTopPerformers
} from '../controllers/resultController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const resultValidation = [
  body('student_ic')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('Student IC must be in format: 123456-78-9012'),
  body('exam_id')
    .isInt()
    .withMessage('Exam ID must be a valid integer'),
  body('markah')
    .isInt({ min: 0, max: 100 })
    .withMessage('Marks must be between 0 and 100'),
  body('gred')
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'])
    .withMessage('Grade must be one of: A+, A, A-, B+, B, B-, C+, C, C-', 'D', 'F'),
  body('status')
    .isIn(['lulus', 'gagal'])
    .withMessage('Status must be one of: lulus, gagal'),
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAllResults);
router.get('/stats', getResultStats);
router.get('/top-performers', getTopPerformers);
router.get('/:id', idValidation, getResultById);
router.post('/', requireRole(['admin', 'staff', 'teacher']), resultValidation, createResult);
router.put('/:id', requireRole(['admin', 'staff', 'teacher']), idValidation, resultValidation, updateResult);
router.delete('/:id', requireRole(['admin']), idValidation, deleteResult);

export default router;
