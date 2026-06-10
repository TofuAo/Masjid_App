import { validationResult } from 'express-validator';
import { 
  createToyyibPayBill, 
  getBillStatus,
  parseCallbackData,
  updatePaymentAfterCallback,
  getToyyibPayConfig
} from '../services/toyyibpayService.js';
import { createPaymentIntent, getPaymentById, updatePaymentStatus } from '../services/paymentService.js';
import { pool } from '../config/database.js';

/**
 * Initiate ToyyibPay Payment
 * POST /api/toyyibpay/initiate
 * 
 * This endpoint creates a payment intent and generates a ToyyibPay bill
 * Replaces all previous payment gateway initialization endpoints
 */
export const initiateToyyibPayPayment = async (req, res) => {
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
      description: initialDescription = 'Payment',
      customerName: initialCustomerName,
      customerEmail: initialCustomerEmail,
      customerPhone: initialCustomerPhone,
      feeId // Optional: Link payment to a fee (yuran) record
    } = req.body;

    // Validate amount
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Get user information
    const userPhone = req.user?.telefon || req.user?.userId || 'anonymous';
    
    // Initialize variables that can be modified
    let description = initialDescription;
    let customerName = initialCustomerName;
    let customerEmail = initialCustomerEmail;
    let customerPhone = initialCustomerPhone;
    
    // If feeId is provided, fetch fee details for description
    let feeDetails = null;
    if (feeId) {
      try {
        const [fees] = await pool.execute(
          `SELECT f.*, u.nama as pelajar_nama, u.email, u.telefon
           FROM fees f
           JOIN users u ON f.student_telefon = u.telefon
           WHERE f.id = ?`,
          [feeId]
        );
        
        if (fees.length > 0) {
          feeDetails = fees[0];
          // Use fee details for customer info if not provided
          if (!customerName && feeDetails.pelajar_nama) {
            customerName = feeDetails.pelajar_nama;
          }
          if (!customerEmail && feeDetails.email) {
            customerEmail = feeDetails.email;
          }
          if (!customerPhone && feeDetails.telefon) {
            customerPhone = feeDetails.telefon;
          }
          // Enhance description with fee details
          if (feeDetails.bulan && feeDetails.tahun) {
            description = `Yuran ${feeDetails.bulan} ${feeDetails.tahun} - ${feeDetails.pelajar_nama || description}`;
          }
        }
      } catch (error) {
        console.error('Error fetching fee details:', error);
        // Continue without fee details
      }
    }

    // Generate unique reference
    const reference = feeId 
      ? `FEE-${feeId}-${Date.now()}` 
      : `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment intent in our database
    const payment = await createPaymentIntent({
      user_telefon: userPhone,
      amount: Number(amount),
      currency: 'MYR',
      method: 'toyyibpay',
      provider: 'toyyibpay',
      metadata: {
        description,
        reference,
        feeId: feeId || null,
        customerName,
        customerEmail,
        customerPhone
      }
    });

    // Create ToyyibPay bill
    let billCode, paymentUrl;
    try {
      // Get config for return URL
      const config = await getToyyibPayConfig();
      
      // Build return URL with payment ID for automatic receipt display
      const baseReturnUrl = config.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`;
      const returnUrlWithPaymentId = `${baseReturnUrl}${baseReturnUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`;
      
      const billResult = await createToyyibPayBill({
        amount: Number(amount),
        description,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        reference,
        paymentId: payment.id,
        returnUrl: returnUrlWithPaymentId
      });

      billCode = billResult.billCode;
      paymentUrl = billResult.paymentUrl;
    } catch (error) {
      // If bill creation fails, mark payment as failed
      try {
        await updatePaymentStatus(payment.id, 'failed');
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
      
      // Extract error message properly
      let errorMessage = 'Failed to create ToyyibPay bill';
      if (error && error.message) {
        errorMessage = error.message.trim();
        // If message is just whitespace or tab, use default
        if (!errorMessage || errorMessage.length === 0 || errorMessage === '\t') {
          errorMessage = 'Failed to create ToyyibPay bill. Please check your ToyyibPay configuration.';
        }
      }
      
      console.error('ToyyibPay bill creation error:', error);
      
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }

    // Update payment with bill code
    await updatePaymentStatus(payment.id, 'processing', billCode);
    
    // Update metadata with bill code
    await pool.execute(
      'UPDATE payments SET metadata = ? WHERE id = ?',
      [
        JSON.stringify({
          description,
          reference,
          billCode,
          feeId: feeId || null,
          customerName,
          customerEmail,
          customerPhone
        }),
        payment.id
      ]
    );

    res.json({
      success: true,
      message: 'Payment bill created successfully',
      data: {
        paymentId: payment.id,
        billCode,
        paymentUrl,
        amount: Number(amount),
        description,
        reference
      }
    });
  } catch (error) {
    console.error('ToyyibPay initiate error:', error);
    
    // Extract error message properly
    let errorMessage = 'Failed to initiate payment';
    if (error && error.message) {
      errorMessage = error.message.trim();
      // If message is just whitespace or tab, use default
      if (!errorMessage || errorMessage.length === 0 || errorMessage === '\t') {
        errorMessage = 'Failed to initiate payment. Please check your configuration.';
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * ToyyibPay Callback/Webhook Handler
 * POST /api/toyyibpay/callback
 * 
 * This endpoint receives payment status updates from ToyyibPay
 * ToyyibPay will call this URL after payment is completed/failed
 * 
 * IMPORTANT: This endpoint should be publicly accessible (no authentication required)
 * Security is handled by verifying the bill code exists in our database
 */
export const toyibPayCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    // Extract bill code from callback
    const billCode = callbackData.billcode || callbackData.billCode;
    
    if (!billCode) {
      console.error('ToyyibPay callback missing bill code:', callbackData);
      return res.status(400).send('Missing bill code');
    }

    // Find payment by bill code (stored in provider_reference)
    const [payments] = await pool.execute(
      'SELECT id, status, metadata FROM payments WHERE provider_reference = ? LIMIT 1',
      [billCode]
    );

    if (payments.length === 0) {
      console.error('ToyyibPay callback: Payment not found for bill code:', billCode);
      // Still return OK to ToyyibPay to prevent retries
      return res.status(200).send('OK');
    }

    const payment = payments[0];

    // Parse callback data
    const parsed = parseCallbackData(callbackData);

    // Update payment record
    await updatePaymentAfterCallback(payment.id, callbackData);

    // Log the callback
    console.log(`ToyyibPay callback processed: Payment ${payment.id}, Status: ${parsed.status}, Bill Code: ${billCode}`);

    // Return OK to ToyyibPay (they expect "OK" response)
    res.status(200).send('OK');
  } catch (error) {
    console.error('ToyyibPay callback error:', error);
    // Still return OK to prevent ToyyibPay from retrying
    // But log the error for investigation
    res.status(200).send('OK');
  }
};

/**
 * Check Payment Status
 * GET /api/toyyibpay/status/:paymentId
 * 
 * Allows checking payment status manually (useful if webhook fails)
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userPhone = req.user?.telefon || req.user?.userId;
    const userRole = req.user?.role;

    // Get payment
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check access permissions
    if (userRole !== 'admin' && payment.user_telefon !== userPhone) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If payment has a bill code, check status from ToyyibPay
    if (payment.provider_reference) {
      try {
        const billStatus = await getBillStatus(payment.provider_reference);
        
        // Update payment if status changed
        if (billStatus.status !== payment.status) {
          await updatePaymentStatus(payment.id, billStatus.status);
        }

        return res.json({
          success: true,
          data: {
            paymentId: payment.id,
            status: billStatus.status,
            amount: billStatus.amount,
            paidAt: billStatus.paidAt,
            transactionId: billStatus.transactionId,
            lastChecked: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error checking bill status:', error);
        // Return current payment status if check fails
        return res.json({
          success: true,
          data: {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            lastChecked: new Date().toISOString(),
            error: 'Could not fetch latest status from ToyyibPay'
          }
        });
      }
    }

    // No bill code, return current status
    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
};

/**
 * Get ToyyibPay Configuration (Admin only)
 * GET /api/toyyibpay/config
 * 
 * Returns current ToyyibPay configuration (without sensitive data)
 */
export const getToyyibPayConfigEndpoint = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const config = await getToyyibPayConfig();

    // Don't expose full secret key, only show last 4 characters
    const maskedSecretKey = config.secretKey 
      ? `****${config.secretKey.slice(-4)}` 
      : null;

    res.json({
      success: true,
      data: {
        isTestMode: config.isTestMode,
        baseUrl: config.baseUrl,
        returnUrl: config.returnUrl,
        callbackUrl: config.callbackUrl,
        categoryCode: config.categoryCode,
        secretKey: maskedSecretKey,
        configured: !!(config.secretKey && config.categoryCode)
      }
    });
  } catch (error) {
    console.error('Get ToyyibPay config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration'
    });
  }
};
