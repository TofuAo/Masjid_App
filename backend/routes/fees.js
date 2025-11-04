import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllFees,
  getFeeById,
  createFee,
  updateFee,
  markAsPaid,
  deleteFee,
  getFeeStats
} from '../controllers/feeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const feeValidation = [
  body('student_ic')
    .matches(/^\d{6}-\d{2}-\d{4}$/)
    .withMessage('Student IC must be in format: 123456-78-9012'),
  body('jumlah')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('status')
    .isIn(['Bayar', 'Belum Bayar'])
    .withMessage('Status must be one of: Bayar, Belum Bayar'),
  body('tarikh')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('resit_img')
    .optional()
    .isString()
    .withMessage('Receipt image must be a string')
];

const markPaidValidation = [
  body('cara_bayar')
    .optional()
    .isString()
    .withMessage('Payment method must be a string'),
  body('no_resit')
    .optional()
    .isString()
    .withMessage('Receipt number must be a string'),
  body('resit_img')
    .optional()
    .isString()
    .withMessage('Receipt image must be a string')
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getAllFees);
router.get('/stats', getFeeStats);
router.get('/:id', idValidation, getFeeById);
router.post('/', requireRole(['admin', 'staff']), feeValidation, createFee);
router.put('/:id', requireRole(['admin', 'staff']), idValidation, feeValidation, updateFee);
router.put('/:id/mark-paid', requireRole(['admin', 'staff']), idValidation, markPaidValidation, markAsPaid);
router.delete('/:id', requireRole(['admin']), idValidation, deleteFee);

export default router;
