import express from 'express';
import {
  getReceiptByNumber,
  getFeeReceipt,
  getPaymentReceipt,
  getUserReceipts
} from '../controllers/receiptController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get receipt by receipt number
router.get('/:receiptNumber', getReceiptByNumber);

// Get receipt for a fee
router.get('/fee/:feeId', getFeeReceipt);

// Get receipt for a payment
router.get('/payment/:paymentId', getPaymentReceipt);

// Get all receipts for a user
router.get('/user/:userId', getUserReceipts);

export default router;


