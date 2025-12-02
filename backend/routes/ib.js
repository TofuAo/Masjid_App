import express from 'express';
import { body } from 'express-validator';
import { 
  getMonthlyPaymentReport, 
  confirmMonthlyPayment, 
  getAvailableMonthlyReports 
} from '../controllers/ibController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All IB routes require authentication and IB role
router.use(authenticateToken);
router.use(requireRole(['ib', 'admin'])); // Admin can also access for management

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

export default router;

