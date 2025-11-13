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
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';

const router = express.Router();

// Validation rules
const feeValidation = [
  body('student_ic')
    .custom((value) => {
      // Accept multiple formats:
      // - 12 digits: 123456-78-9012 or 123456789012
      // - ICs starting with S: S0102020512 (11 characters)
      if (!value) return false;
      const cleaned = value.replace(/-/g, '').toUpperCase();
      // Check for 12-digit format OR S-prefixed format (S + 10 digits)
      return /^\d{12}$/.test(cleaned) || /^S\d{10}$/.test(cleaned);
    })
    .withMessage('Student IC must be 12 digits (format: 123456-78-9012 or 123456789012) or S-prefixed format (S0102020512)'),
  body('jumlah')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('status')
    .isIn(['Bayar', 'Belum Bayar', 'terbayar', 'tunggak'])
    .withMessage('Status must be one of: Bayar, Belum Bayar, terbayar, tunggak'),
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
router.post('/', requireRole(['admin', 'staff']), feeValidation, normalizeICMiddleware, createFee);
router.put('/:id', requireRole(['admin', 'staff']), idValidation, feeValidation, normalizeICMiddleware, updateFee);
router.put('/:id/mark-paid', requireRole(['admin', 'staff']), idValidation, markPaidValidation, markAsPaid);
router.delete('/:id', requireRole(['admin']), idValidation, deleteFee);

export default router;
