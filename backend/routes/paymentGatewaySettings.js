import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getPaymentGateways,
  getActivePaymentGateway,
  updatePaymentGateway
} from '../controllers/paymentGatewaySettingsController.js';

const router = express.Router();

// Validation middleware
const updatePaymentGatewayValidation = [
  body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
  body('is_test_mode').optional().isBoolean().withMessage('Test mode must be a boolean'),
  body('credentials').optional().isObject().withMessage('Credentials must be an object'),
  body('enabled_methods').optional().isArray().withMessage('Enabled methods must be an array'),
  body('redirect_urls').optional().isObject().withMessage('Redirect URLs must be an object'),
  body('webhook_url').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Webhook URL must be a valid URL'),
  body('callback_url').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Callback URL must be a valid URL'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

// Public route - get active payment gateway
router.get('/active', getActivePaymentGateway);

// Admin routes
router.get('/', authenticateToken, requireRole(['admin']), getPaymentGateways);
router.put('/:gatewayName', authenticateToken, requireRole(['admin']), updatePaymentGatewayValidation, updatePaymentGateway);

export default router;

