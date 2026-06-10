import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  initiateToyyibPayPayment, 
  toyibPayCallback,
  checkPaymentStatus,
  getToyyibPayConfigEndpoint
} from '../controllers/toyyibPayController.js';

const router = express.Router();

/**
 * ToyyibPay Payment Routes
 * 
 * This router handles all ToyyibPay payment operations
 * Replaces all previous payment gateway routes
 */

// Validation rules
const initiatePaymentValidation = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('customerName')
    .optional()
    .isString()
    .withMessage('Customer name must be a string'),
  body('customerEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('customerPhone')
    .optional()
    .isString()
    .withMessage('Customer phone must be a string'),
  body('feeId')
    .optional()
    .isInt()
    .withMessage('Fee ID must be a valid integer')
];

/**
 * POST /api/toyyibpay/initiate
 * Initiate a new ToyyibPay payment
 * Requires authentication
 */
router.post(
  '/initiate',
  authenticateToken,
  initiatePaymentValidation,
  initiateToyyibPayPayment
);

/**
 * POST /api/toyyibpay/callback
 * Webhook endpoint for ToyyibPay payment callbacks
 * NO AUTHENTICATION REQUIRED - ToyyibPay calls this directly
 * Security is handled by verifying bill code exists in database
 */
router.post('/callback', toyibPayCallback);

/**
 * GET /api/toyyibpay/status/:paymentId
 * Check payment status manually
 * Requires authentication
 */
router.get(
  '/status/:paymentId',
  authenticateToken,
  param('paymentId').isUUID().withMessage('Invalid payment ID'),
  checkPaymentStatus
);

/**
 * GET /api/toyyibpay/config
 * Get ToyyibPay configuration (admin only)
 * Returns configuration without exposing sensitive data
 */
router.get(
  '/config',
  authenticateToken,
  requireRole(['admin']),
  getToyyibPayConfigEndpoint
);

export default router;

