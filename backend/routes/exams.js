import express from 'express';
import { body } from 'express-validator';
import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} from '../controllers/examController.js';
import { authenticateToken as protect, requireRole as authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation for exam creation and update
const examValidation = [
  body('class_id').notEmpty().withMessage('Class ID is required').isInt().withMessage('Class ID must be an integer'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('tarikh_exam').isISO8601().withMessage('Exam date is invalid'),
];

router.route('/')
  .get(protect, getAllExams)
  .post(protect, authorize(['admin', 'teacher']), examValidation, createExam);

router.route('/:id')
  .get(protect, getExamById)
  .put(protect, authorize(['admin', 'teacher']), examValidation, updateExam)
  .delete(protect, authorize(['admin']), deleteExam);

export default router;
