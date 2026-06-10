import express from 'express';
import { body } from 'express-validator';
import { 
  getMonthlyPaymentReport, 
  confirmMonthlyPayment, 
  getAvailableMonthlyReports,
  confirmClassAttendance,
  confirmClassFees,
  getClassDocuments,
  approvePaymentsByDateRange,
  getApprovalHistory,
  flagPayment,
  getFlaggedPayments,
  exportMonthlySummary,
  exportApprovalHistory
} from '../controllers/ibController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All IB routes require authentication
router.use(authenticateToken);

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

// Get available monthly reports for confirmation (IB and admin can view)
router.get('/reports', requireRole(['ib', 'admin']), getAvailableMonthlyReports);

// Get detailed monthly payment report (IB and admin can view)
router.get('/report', requireRole(['ib', 'admin']), getMonthlyPaymentReport);

// Confirm monthly payment report - IB ONLY
router.post('/confirm', requireRole(['ib']), confirmValidation, confirmMonthlyPayment);

// Get class documents for confirmation (IB and admin can view)
router.get('/class-documents', requireRole(['ib', 'admin']), getClassDocuments);

// Bulk confirm class attendance documents - IB ONLY
router.post('/confirm-class-attendance',
  requireRole(['ib']),
  body('class_id').isInt().withMessage('Class ID must be a valid integer'),
  body('exclude_student_telefons').optional().isArray().withMessage('Exclude student ICs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean'),
  confirmClassAttendance
);

// Bulk confirm class fee documents - IB ONLY
router.post('/confirm-class-fees',
  requireRole(['ib']),
  body('class_id').isInt().withMessage('Class ID must be a valid integer'),
  body('exclude_student_telefons').optional().isArray().withMessage('Exclude student ICs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean'),
  confirmClassFees
);

// Approve payments by date range - IB ONLY
router.post('/approve-payments-by-date',
  requireRole(['ib']),
  body('bulan').notEmpty().withMessage('Bulan diperlukan'),
  body('tahun').isInt({ min: 2020, max: 2100 }).withMessage('Tahun mesti antara 2020 dan 2100'),
  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  body('exclude_payment_ids').optional().isArray().withMessage('Exclude payment IDs must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  approvePaymentsByDateRange
);

// Audit trail history
router.get('/history',
  requireRole(['ib', 'admin']),
  getApprovalHistory
);

// List flagged payments (clarifications)
router.get('/flagged-payments',
  requireRole(['ib', 'admin']),
  getFlaggedPayments
);

// Flag a payment for clarification / send back to PIC
router.post('/flag-payment',
  requireRole(['ib']),
  body('payment_id').isInt().withMessage('Payment ID must be an integer'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('send_back_to_pic').optional().isBoolean().withMessage('send_back_to_pic must be boolean'),
  flagPayment
);

router.get('/export/summary',
  requireRole(['ib', 'admin']),
  exportMonthlySummary
);

router.get('/export/history',
  requireRole(['ib', 'admin']),
  exportApprovalHistory
);

export default router;


