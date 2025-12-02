import express from 'express';
import { body } from 'express-validator';
import { 
  getMonthlyPaymentReport, 
  confirmMonthlyPayment, 
  getAvailableMonthlyReports,
  confirmClassAttendance,
  confirmClassFees,
  getClassDocuments,
  approvePaymentsByDateRange
} from '../controllers/ibController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All IB routes require authentication and IB or admin role
router.use(authenticateToken);
router.use(requireRole(['ib', 'admin'])); // Allow IB users and admins

// Validation for confirmation
const confirmValidation = [
  body('bulan')
    .notEmpty()
    .withMessage('Bulan diperlukan'),
  body('tahun')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Tahun mesti antara 2020 dan 2100'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'rejected'])
    .withMessage('Status mesti salah satu: pending, confirmed, rejected'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Nota tidak boleh melebihi 1000 aksara')
];

// Get available monthly reports for confirmation
router.get('/reports', getAvailableMonthlyReports);

// Get detailed monthly payment report
router.get('/report', getMonthlyPaymentReport);

// Confirm monthly payment report
router.post('/confirm', confirmValidation, confirmMonthlyPayment);

// Get class documents for confirmation
router.get('/class-documents', getClassDocuments);

// Bulk confirm class attendance documents
router.post('/confirm-class-attendance', 
  body('class_id').isInt().withMessage('Class ID must be a valid integer'),
  body('exclude_student_ics').optional().isArray().withMessage('Exclude student ICs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean'),
  confirmClassAttendance
);

// Bulk confirm class fee documents
router.post('/confirm-class-fees',
  body('class_id').isInt().withMessage('Class ID must be a valid integer'),
  body('exclude_student_ics').optional().isArray().withMessage('Exclude student ICs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean'),
  confirmClassFees
);

// Approve payments by date range
router.post('/approve-payments-by-date',
  body('bulan').notEmpty().withMessage('Bulan diperlukan'),
  body('tahun').isInt({ min: 2020, max: 2100 }).withMessage('Tahun mesti antara 2020 dan 2100'),
  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  body('exclude_payment_ids').optional().isArray().withMessage('Exclude payment IDs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  approvePaymentsByDateRange
);

export default router;

