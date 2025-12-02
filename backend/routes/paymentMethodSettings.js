import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getPaymentMethods,
  getEnabledPaymentMethods,
  updatePaymentMethod,
  bulkUpdatePaymentMethods
} from '../controllers/paymentMethodSettingsController.js';

const router = express.Router();

// Validation middleware
const updatePaymentMethodValidation = [
  body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
  body('provider').optional().isString().withMessage('Provider must be a string'),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('config').optional().isObject().withMessage('Config must be an object'),
  body('merchant_account_name').optional().isString().withMessage('Merchant account name must be a string'),
  body('merchant_account_number').optional().isString().withMessage('Merchant account number must be a string'),
  body('merchant_bank_name').optional().isString().withMessage('Merchant bank name must be a string'),
  body('merchant_account_type').optional().isIn(['bank_account', 'ewallet', 'gateway_account']).withMessage('Account type must be bank_account, ewallet, or gateway_account'),
  body('gateway_merchant_id').optional().isString().withMessage('Gateway merchant ID must be a string'),
  body('gateway_api_key').optional().isString().withMessage('Gateway API key must be a string'),
  body('gateway_secret_key').optional().isString().withMessage('Gateway secret key must be a string'),
  body('is_test_mode').optional().isBoolean().withMessage('Test mode must be a boolean')
];

const bulkUpdateValidation = [
  body('methods').isArray().withMessage('Methods must be an array'),
  body('methods.*.method_code').notEmpty().withMessage('Method code is required'),
  body('methods.*.enabled').optional().isBoolean(),
  body('methods.*.provider').optional().isString(),
  body('methods.*.display_order').optional().isInt({ min: 0 }),
  body('methods.*.description').optional().isString(),
  body('methods.*.config').optional().isObject(),
  body('methods.*.merchant_account_name').optional().isString(),
  body('methods.*.merchant_account_number').optional().isString(),
  body('methods.*.merchant_bank_name').optional().isString(),
  body('methods.*.merchant_account_type').optional().isIn(['bank_account', 'ewallet', 'gateway_account']),
  body('methods.*.gateway_merchant_id').optional().isString(),
  body('methods.*.gateway_api_key').optional().isString(),
  body('methods.*.gateway_secret_key').optional().isString(),
  body('methods.*.is_test_mode').optional().isBoolean()
];

// Public route - get enabled payment methods
router.get('/enabled', getEnabledPaymentMethods);

// Admin routes
router.get('/', authenticateToken, requireRole(['admin']), getPaymentMethods);
// IMPORTANT: /bulk must come BEFORE /:methodCode to avoid route matching conflicts
router.put('/bulk', authenticateToken, requireRole(['admin']), bulkUpdateValidation, bulkUpdatePaymentMethods);
router.put('/:methodCode', authenticateToken, requireRole(['admin']), updatePaymentMethodValidation, updatePaymentMethod);

export default router;

