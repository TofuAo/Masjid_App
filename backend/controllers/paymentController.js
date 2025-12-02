import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import {
  createPaymentIntent,
  getPaymentById,
  getPaymentsByUser,
  getAllPayments,
  updatePaymentStatus,
  updatePaymentProof,
  checkIdempotency,
  storeIdempotencyKey,
  getPaymentLogs,
  createReconciliationRecord
} from '../services/paymentService.js';
import { getPaymentGatewayService } from '../services/paymentGatewayService.js';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

/**
 * Create Payment Intent
 * POST /api/payments/create
 */
export const createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      currency = 'MYR',
      method,
      provider,
      metadata = {},
      idempotency_key
    } = req.body;

    const userIc = req.user.ic || req.user.userId;

    // Check idempotency
    if (idempotency_key) {
      const existing = await checkIdempotency(idempotency_key);
      if (existing) {
        const payment = await getPaymentById(existing.payment_id);
        return res.json({
          success: true,
          message: 'Payment intent already created',
          data: payment,
          idempotent: true
        });
      }
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Validate method
    const validMethods = ['fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Validate provider
    const validProviders = ['ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment provider'
      });
    }

    // Set expiration (30 minutes for QR, 15 minutes for redirect)
    const expiresAt = new Date();
    if (method.includes('qr') || method.includes('request')) {
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    } else {
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    }

    // Create payment intent
    const payment = await createPaymentIntent({
      user_ic: userIc,
      amount: parseFloat(amount),
      currency,
      method,
      provider,
      metadata,
      idempotency_key: idempotency_key || crypto.randomBytes(16).toString('hex'),
      expires_at: expiresAt
    });

    // Store idempotency key if provided
    if (idempotency_key) {
      await storeIdempotencyKey(idempotency_key, payment.id, { payment_id: payment.id });
    }

    res.status(201).json({
      success: true,
      message: 'Payment intent created',
      data: payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Payment by ID
 * GET /api/payments/:id
 */
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userIc = req.user.ic || req.user.userId;
    const userRole = req.user.role;

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Users can only view their own payments (unless admin)
    if (userRole !== 'admin' && payment.user_ic !== userIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get payment logs
    const logs = await getPaymentLogs(id);

    res.json({
      success: true,
      data: {
        ...payment,
        metadata: payment.metadata ? JSON.parse(payment.metadata) : {},
        webhook_data: payment.webhook_data ? JSON.parse(payment.webhook_data) : null,
        logs
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Payments by User
 * GET /api/payments/user/:userId
 */
export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserIc = req.user.ic || req.user.userId;
    const userRole = req.user.role;

    // Users can only view their own payments (unless admin)
    if (userRole !== 'admin' && userId !== requestingUserIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const payments = await getPaymentsByUser(userId, limit, offset);

    res.json({
      success: true,
      data: payments.map(p => ({
        ...p,
        metadata: p.metadata ? JSON.parse(p.metadata) : {},
        webhook_data: p.webhook_data ? JSON.parse(p.webhook_data) : null
      }))
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get All Payments (Admin)
 * GET /api/payments/admin
 */
export const getAdminPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const filters = {
      status: req.query.status,
      method: req.query.method,
      provider: req.query.provider,
      user_ic: req.query.user_ic,
      search: req.query.search
    };

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const payments = await getAllPayments(filters, limit, offset);

    res.json({
      success: true,
      data: payments.map(p => ({
        ...p,
        metadata: p.metadata ? JSON.parse(p.metadata) : {},
        webhook_data: p.webhook_data ? JSON.parse(p.webhook_data) : null
      })),
      pagination: {
        limit,
        offset,
        total: payments.length
      }
    });
  } catch (error) {
    console.error('Get admin payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update Payment Status
 * PATCH /api/payments/:id/status
 */
export const updateStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const payment = await updatePaymentStatus(id, status);

    res.json({
      success: true,
      message: 'Payment status updated',
      data: payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Initialize Payment Gateway
 * POST /api/payments/:id/initialize
 */
export const initializePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userIc = req.user.ic || req.user.userId;

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user_ic !== userIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in pending status'
      });
    }

    // Check if expired
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      await updatePaymentStatus(id, 'expired');
      return res.status(400).json({
        success: false,
        message: 'Payment has expired'
      });
    }

    // Get gateway config from environment
    const gatewayConfig = getGatewayConfig(payment.provider);
    const gatewayService = getPaymentGatewayService(payment.provider, gatewayConfig);

    // Get user info
    const [users] = await pool.execute(
      'SELECT nama, email, telefon FROM users WHERE ic = ?',
      [userIc]
    );
    const user = users[0];

    // Prepare payment data
    const paymentData = {
      paymentId: payment.id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      method: payment.method,
      userName: user.nama,
      userEmail: user.email || '',
      userContact: user.telefon || '',
      description: payment.metadata ? JSON.parse(payment.metadata).description || 'Payment' : 'Payment',
      responseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return?payment_id=${payment.id}`,
      backendUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhook/payment`
    };

    // Handle different payment methods
    if (payment.method === 'duitnow_qr' && payment.provider === 'paynet_direct') {
      // Generate DuitNow QR
      const qrData = await gatewayService.generateDuitNowQR(paymentData);
      
      await updatePaymentStatus(id, 'processing', null, { qr_data: qrData });

      return res.json({
        success: true,
        data: {
          payment_id: payment.id,
          qr_code: qrData.qrCode,
          qr_url: qrData.qrUrl,
          expires_at: qrData.expiresAt,
          type: 'qr'
        }
      });
    } else if (payment.method === 'duitnow_request' && payment.provider === 'paynet_direct') {
      // Create DuitNow Request
      const requestData = await gatewayService.createDuitNowRequest({
        ...paymentData,
        customerPhone: user.telefon
      });

      await updatePaymentStatus(id, 'processing', null, { request_data: requestData });

      return res.json({
        success: true,
        data: {
          payment_id: payment.id,
          request_id: requestData.requestId,
          deep_link: requestData.deepLink,
          expires_at: requestData.expiresAt,
          type: 'request'
        }
      });
    } else {
      // Redirect flow (FPX, E-Wallets via aggregator)
      const redirectData = await gatewayService.createPayment(paymentData);

      await updatePaymentStatus(id, 'processing');

      return res.json({
        success: true,
        data: {
          payment_id: payment.id,
          redirect_url: redirectData.redirectUrl,
          redirect_params: redirectData.params,
          redirect_method: redirectData.method,
          type: 'redirect'
        }
      });
    }
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Upload Payment Proof
 * POST /api/payments/:id/proof
 */
export const uploadProof = async (req, res) => {
  try {
    const { id } = req.params;
    const userIc = req.user.ic || req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Proof file is required'
      });
    }

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user_ic !== userIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Upload to storage (S3 or local)
    const proofUrl = await uploadToStorage(req.file, `payments/${id}/proof`);

    await updatePaymentProof(id, proofUrl);

    res.json({
      success: true,
      message: 'Proof uploaded successfully',
      data: {
        proof_url: proofUrl
      }
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Requery Payment from Provider
 * POST /api/payments/:id/requery
 */
export const requeryPayment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (!payment.provider_reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment does not have provider reference'
      });
    }

    // Get gateway service
    const gatewayConfig = getGatewayConfig(payment.provider);
    const gatewayService = getPaymentGatewayService(payment.provider, gatewayConfig);

    // Check status from provider
    if (payment.provider === 'paynet_direct' && gatewayService.checkPaymentStatus) {
      const statusData = await gatewayService.checkPaymentStatus(payment.provider_reference);

      // Update local status if different
      if (statusData.status !== payment.status) {
        await updatePaymentStatus(id, statusData.status, statusData.providerReference);
        await createReconciliationRecord(id, statusData.status, payment.status, 'Requeried from provider');
      }

      return res.json({
        success: true,
        message: 'Payment requeried',
        data: {
          provider_status: statusData.status,
          local_status: payment.status,
          updated: statusData.status !== payment.status
        }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Requery not supported for this provider'
    });
  } catch (error) {
    console.error('Requery payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Helper function to get gateway config from environment
const getGatewayConfig = (provider) => {
  const config = {
    sandbox: process.env.NODE_ENV !== 'production'
  };

  switch (provider) {
    case 'ipay88':
      return {
        ...config,
        merchantCode: process.env.IPAY88_MERCHANT_CODE,
        merchantKey: process.env.IPAY88_MERCHANT_KEY
      };
    case 'eghl':
      return {
        ...config,
        serviceId: process.env.EGHL_SERVICE_ID,
        password: process.env.EGHL_PASSWORD
      };
    case 'paynet_direct':
      return {
        ...config,
        clientId: process.env.PAYNET_CLIENT_ID,
        clientSecret: process.env.PAYNET_CLIENT_SECRET
      };
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

// Helper function to upload file to storage
// Note: fs and path are already imported at the top of the file

const uploadToStorage = async (file, filePath) => {
  // For now, use local storage
  // In production, integrate with S3 or similar
  const uploadDir = path.join(process.cwd(), 'uploads', filePath);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, file.buffer);

  return `/uploads/${filePath}/${filename}`;
};

