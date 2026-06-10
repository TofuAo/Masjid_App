import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createPayment,
  getPayment,
  getUserPayments,
  getAdminPayments,
  updateStatus,
  initializePayment,
  uploadProof,
  requeryPayment
} from '../controllers/paymentController.js';
import { handlePaymentWebhook } from '../controllers/webhookController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Configure multer for proof uploads
const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// Validation rules
const createPaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('method')
    .isIn(['fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay'])
    .withMessage('Invalid payment method'),
  body('provider')
    .isIn(['ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct'])
    .withMessage('Invalid payment provider'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('idempotency_key')
    .optional()
    .isString()
    .withMessage('Idempotency key must be a string')
];

const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired'])
    .withMessage('Invalid status')
];

// Routes
router.post(
  '/create',
  authenticateToken,
  createPaymentValidation,
  createPayment
);

router.get(
  '/:id',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid payment ID'),
  getPayment
);

router.get(
  '/user/:userId',
  authenticateToken,
  param('userId').notEmpty().withMessage('User ID is required'),
  getUserPayments
);

router.get(
  '/admin',
  authenticateToken,
  requireRole(['admin']),
  query('status').optional().isString(),
  query('method').optional().isString(),
  query('provider').optional().isString(),
  query('user_telefon').optional().isString(),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  getAdminPayments
);

router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['admin']),
  param('id').isUUID().withMessage('Invalid payment ID'),
  updateStatusValidation,
  updateStatus
);

router.post(
  '/:id/initialize',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid payment ID'),
  initializePayment
);

router.post(
  '/:id/proof',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid payment ID'),
  proofUpload.single('proof'),
  uploadProof
);

router.post(
  '/:id/requery',
  authenticateToken,
  requireRole(['admin']),
  param('id').isUUID().withMessage('Invalid payment ID'),
  requeryPayment
);

// Webhook endpoint (no auth required, uses signature verification)
// Note: Webhook is handled at /api/webhook/payment (see server.js)

export default router;


