import axios from 'axios';
import crypto from 'crypto';
import { pool } from '../config/database.js';

/**
 * ToyyibPay Payment Service
 * Complete integration with ToyyibPay API for payment processing
 * 
 * This service replaces all previous payment gateway integrations.
 * ToyyibPay supports: FPX, Credit/Debit Cards, DuitNow QR, E-Wallets (TNG, Boost, GrabPay)
 */

/**
 * Get ToyyibPay configuration from database or environment variables
 * Priority: Database settings > Environment variables
 */
export async function getToyyibPayConfig() {
  try {
    // Try to get from database first (admin-configurable)
    const [settings] = await pool.execute(
      `SELECT credentials, is_test_mode, enabled 
       FROM payment_gateway_settings 
       WHERE gateway_name = 'toyyibpay' 
       LIMIT 1`
    );

    if (settings.length > 0 && settings[0].enabled) {
      const config = settings[0];
      let credentials = {};
      
      try {
        credentials = typeof config.credentials === 'string' 
          ? JSON.parse(config.credentials) 
          : config.credentials || {};
      } catch (e) {
        credentials = {};
      }

      return {
        secretKey: credentials.secret_key || process.env.TOYYIBPAY_SECRET_KEY,
        categoryCode: credentials.category_code || process.env.TOYYIBPAY_CATEGORY_CODE,
        isTestMode: Boolean(config.is_test_mode),
        baseUrl: config.is_test_mode 
          ? 'https://dev.toyyibpay.com' 
          : 'https://toyyibpay.com',
        returnUrl: credentials.return_url || process.env.TOYYIBPAY_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        callbackUrl: credentials.callback_url || process.env.TOYYIBPAY_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/toyyibpay/callback`
      };
    }
  } catch (error) {
    console.error('Error fetching ToyyibPay config from database:', error);
  }

  // Fallback to environment variables
  const isTestMode = process.env.NODE_ENV !== 'production' || process.env.TOYYIBPAY_TEST_MODE === 'true';
  
  return {
    secretKey: process.env.TOYYIBPAY_SECRET_KEY,
    categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
    isTestMode,
    baseUrl: isTestMode ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com',
    returnUrl: process.env.TOYYIBPAY_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
    callbackUrl: process.env.TOYYIBPAY_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/toyyibpay/callback`
  };
}

/**
 * Form encode object for ToyyibPay API (application/x-www-form-urlencoded)
 */
function formEncode(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&');
}

/**
 * Create a payment bill in ToyyibPay
 * This is the main function to initiate a payment
 * 
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Amount in MYR (e.g., 100.50)
 * @param {string} paymentData.description - Payment description
 * @param {string} paymentData.customerName - Customer name
 * @param {string} paymentData.customerEmail - Customer email
 * @param {string} paymentData.customerPhone - Customer phone
 * @param {string} paymentData.reference - Internal reference number (e.g., payment ID or fee ID)
 * @param {string} paymentData.paymentId - Payment ID from our system
 * @returns {Promise<{billCode: string, paymentUrl: string}>}
 */
export async function createToyyibPayBill({
  amount,
  description,
  customerName,
  customerEmail,
  customerPhone,
  reference,
  paymentId
}) {
  try {
    const config = await getToyyibPayConfig();

    if (!config.secretKey || !config.categoryCode) {
      throw new Error('ToyyibPay configuration is missing. Please configure secret key and category code in admin settings.');
    }

    // ToyyibPay API endpoint
    const createBillEndpoint = `${config.baseUrl}/index.php/api/createBill`;

    // Prepare bill data
    // Amount must be in cents (multiply by 100)
    const billAmount = Math.round(Number(amount) * 100);

    const payload = {
      userSecretKey: config.secretKey,
      categoryCode: config.categoryCode,
      billName: description || `Payment ${reference}`,
      billDescription: description || `Payment for reference ${reference}`,
      billPriceSetting: 1, // Fixed price
      billPayorInfo: 1, // Collect payer information
      billAmount: billAmount,
      billReturnUrl: config.returnUrl,
      billCallbackUrl: config.callbackUrl,
      billExternalReferenceNo: reference || paymentId || `REF-${Date.now()}`,
      billTo: customerName || 'Customer',
      billEmail: customerEmail || '',
      billPhone: customerPhone || '',
      billExpiryDate: '', // Empty = use default
      billExpiryDays: 3, // Bill expires in 3 days
      billContentEmail: '', // Email content (optional)
      billChargeToCustomer: 0, // 0 = merchant pays, 1 = customer pays
      billSplitPayment: 0, // 0 = no split payment
      billSplitPaymentArgs: '', // Split payment arguments (if needed)
      billPaymentChannel: '0', // 0 = all channels, or specific: '1'=FPX, '2'=Credit Card, etc.
      billDisplayMerchant: 1, // Display merchant name
      billMultiPayment: 0 // 0 = single payment
    };

    // Make API request
    const response = await axios.post(
      createBillEndpoint,
      formEncode(payload),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // ToyyibPay returns an array with the first element containing the response
    if (!Array.isArray(response.data) || !response.data[0]?.BillCode) {
      const errorMsg = response.data[0]?.msg || 'ToyyibPay did not return a bill code';
      console.error('ToyyibPay API Error:', response.data);
      throw new Error(errorMsg);
    }

    const billCode = response.data[0].BillCode;
    const paymentUrl = `${config.baseUrl}/${billCode}`;

    return {
      billCode,
      paymentUrl,
      billAmount: billAmount / 100 // Return amount in MYR
    };
  } catch (error) {
    console.error('ToyyibPay create bill error:', error);
    
    if (error.response) {
      // API returned an error response
      const errorData = error.response.data;
      throw new Error(
        errorData[0]?.msg || 
        errorData.message || 
        `ToyyibPay API error: ${error.response.status}`
      );
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from ToyyibPay. Please check your internet connection.');
    } else {
      // Error in setting up the request
      throw error;
    }
  }
}

/**
 * Get bill status from ToyyibPay
 * Use this to check payment status if webhook fails
 * 
 * @param {string} billCode - ToyyibPay bill code
 * @returns {Promise<{status: string, amount: number, paidAt: Date|null}>}
 */
export async function getBillStatus(billCode) {
  try {
    const config = await getToyyibPayConfig();

    if (!config.secretKey) {
      throw new Error('ToyyibPay secret key is not configured');
    }

    const statusEndpoint = `${config.baseUrl}/index.php/api/getBillTransactions`;
    
    const payload = {
      userSecretKey: config.secretKey,
      billCode: billCode
    };

    const response = await axios.post(
      statusEndpoint,
      formEncode(payload),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      }
    );

    if (!Array.isArray(response.data) || response.data.length === 0) {
      return {
        status: 'pending',
        amount: 0,
        paidAt: null
      };
    }

    const transaction = response.data[0];
    
    // ToyyibPay status codes:
    // 1 = Paid
    // 2 = Failed
    // 3 = Pending
    const statusMap = {
      '1': 'completed',
      '2': 'failed',
      '3': 'pending'
    };

    return {
      status: statusMap[transaction.billpaymentStatus] || 'pending',
      amount: transaction.billpaymentAmount ? transaction.billpaymentAmount / 100 : 0,
      paidAt: transaction.billpaymentDate || null,
      transactionId: transaction.billpaymentInvoiceNo || null
    };
  } catch (error) {
    console.error('ToyyibPay get bill status error:', error);
    throw error;
  }
}

/**
 * Verify webhook signature (if ToyyibPay provides one)
 * Currently ToyyibPay doesn't use signature verification, but this is here for future use
 */
export function verifyWebhookSignature(data, signature) {
  // ToyyibPay doesn't currently use webhook signatures
  // But we can add verification logic here if they implement it
  // For now, we'll verify by checking the bill code exists in our database
  return true;
}

/**
 * Parse webhook/callback data from ToyyibPay
 * 
 * @param {Object} callbackData - Raw callback data from ToyyibPay
 * @returns {Object} Parsed payment data
 */
export function parseCallbackData(callbackData) {
  const {
    billcode,
    billpaymentStatus,
    billpaymentAmount,
    billpaymentInvoiceNo,
    billpaymentDate,
    billpaymentChannel
  } = callbackData;

  // Status mapping
  // 1 = Paid/Success
  // 2 = Failed
  // 3 = Pending
  const statusMap = {
    '1': 'completed',
    '2': 'failed',
    '3': 'pending'
  };

  return {
    billCode: billcode,
    status: statusMap[billpaymentStatus] || 'pending',
    amount: billpaymentAmount ? billpaymentAmount / 100 : 0, // Convert from cents to MYR
    transactionId: billpaymentInvoiceNo,
    paidAt: billpaymentDate,
    paymentChannel: billpaymentChannel,
    rawStatus: billpaymentStatus
  };
}

/**
 * Update payment record in database after successful/failed payment
 * Also updates the related fee (yuran) record if payment is for a fee
 */
export async function updatePaymentAfterCallback(paymentId, callbackData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const parsed = parseCallbackData(callbackData);

    // Update payment record
    await connection.execute(
      `UPDATE payments 
       SET status = ?, 
           provider_reference = ?,
           paid_amount = ?,
           webhook_data = ?,
           webhook_received = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        parsed.status,
        parsed.billCode,
        parsed.amount,
        JSON.stringify(callbackData),
        paymentId
      ]
    );

    // If payment is completed and linked to a fee (yuran), update the fee status
    if (parsed.status === 'completed') {
      // Check if payment metadata contains fee_id
      const [payments] = await connection.execute(
        'SELECT metadata FROM payments WHERE id = ?',
        [paymentId]
      );

      if (payments.length > 0) {
        try {
          const metadata = typeof payments[0].metadata === 'string' 
            ? JSON.parse(payments[0].metadata) 
            : payments[0].metadata || {};

          if (metadata.fee_id) {
            // Update fee status to paid
            await connection.execute(
              `UPDATE fees 
               SET status = 'terbayar',
                   tarikh_bayar = CURRENT_DATE,
                   cara_bayar = 'ToyyibPay',
                   no_resit = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [parsed.transactionId || `TPAY-${Date.now()}`, metadata.fee_id]
            );
          }
        } catch (e) {
          console.error('Error updating fee record:', e);
          // Don't fail the transaction if fee update fails
        }
      }
    }

    // Log the payment status change
    await connection.execute(
      `INSERT INTO payment_logs (payment_id, action, status_from, status_to, message, metadata)
       VALUES (?, 'webhook_received', ?, ?, 'Payment status updated from ToyyibPay callback', ?)`,
      [
        paymentId,
        'pending',
        parsed.status,
        JSON.stringify(parsed)
      ]
    );

    await connection.commit();
    return parsed;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
