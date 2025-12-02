import { getPaymentById, updatePaymentStatus } from '../services/paymentService.js';
import { getPaymentGatewayService } from '../services/paymentGatewayService.js';
import crypto from 'crypto';

/**
 * Payment Webhook Handler
 * POST /api/webhook/payment
 */
export const handlePaymentWebhook = async (req, res) => {
  try {
    const provider = req.body.provider || req.query.provider || req.headers['x-payment-provider'];
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider not specified'
      });
    }

    // Get gateway config
    const gatewayConfig = getGatewayConfig(provider);
    const gatewayService = getPaymentGatewayService(provider, gatewayConfig);

    // Verify webhook signature
    const signature = req.headers['x-signature'] || req.body.Signature || req.body.HashValue;
    const isValid = gatewayService.verifyWebhookSignature(req.body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature:', {
        provider,
        signature,
        body: req.body
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Parse webhook data
    const webhookData = gatewayService.parseWebhook(req.body);
    const { paymentId, providerReference, status, amount, currency, method, message } = webhookData;

    // Get payment
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      console.error('Payment not found for webhook:', paymentId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify amount matches
    if (Math.abs(parseFloat(amount) - parseFloat(payment.amount)) > 0.01) {
      console.error('Amount mismatch:', {
        webhook: amount,
        payment: payment.amount
      });
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    // Map gateway status to our status
    const statusMap = {
      'completed': 'completed',
      'success': 'completed',
      '1': 'completed',
      'failed': 'failed',
      'failure': 'failed',
      '2': 'failed',
      'pending': 'processing',
      'processing': 'processing'
    };

    const mappedStatus = statusMap[status] || 'processing';

    // Update payment status
    await updatePaymentStatus(
      paymentId,
      mappedStatus,
      providerReference,
      {
        ...req.body,
        parsed: webhookData,
        received_at: new Date().toISOString()
      }
    );

    // Return success response (gateway expects 200)
    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent gateway retries for our errors
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Helper function to get gateway config
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

