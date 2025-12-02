import cron from 'node-cron';
import { pool } from '../config/database.js';
import { getPaymentById, updatePaymentStatus, createReconciliationRecord } from '../services/paymentService.js';
import { getPaymentGatewayService } from '../services/paymentGatewayService.js';

/**
 * Payment Reconciliation Job
 * Runs daily to check unsettled payments with providers
 */
export const schedulePaymentReconciliation = () => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Reconciliation] Starting daily payment reconciliation...');
    
    try {
      // Get all pending/processing payments older than 1 hour
      const [payments] = await pool.execute(
        `SELECT * FROM payments 
         WHERE status IN ('pending', 'processing') 
         AND provider_reference IS NOT NULL
         AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
         ORDER BY created_at ASC
         LIMIT 100`
      );

      console.log(`[Reconciliation] Found ${payments.length} payments to reconcile`);

      for (const payment of payments) {
        try {
          // Get gateway service
          const gatewayConfig = getGatewayConfig(payment.provider);
          const gatewayService = getPaymentGatewayService(payment.provider, gatewayConfig);

          // Check status from provider (if supported)
          if (payment.provider === 'paynet_direct' && gatewayService.checkPaymentStatus) {
            const statusData = await gatewayService.checkPaymentStatus(payment.provider_reference);

            // Update if status changed
            if (statusData.status !== payment.status) {
              await updatePaymentStatus(
                payment.id,
                statusData.status,
                statusData.providerReference
              );

              await createReconciliationRecord(
                payment.id,
                statusData.status,
                payment.status,
                'Automated daily reconciliation'
              );

              console.log(`[Reconciliation] Updated payment ${payment.id}: ${payment.status} -> ${statusData.status}`);
            }
          }
        } catch (error) {
          console.error(`[Reconciliation] Error reconciling payment ${payment.id}:`, error.message);
          // Continue with next payment
        }
      }

      console.log('[Reconciliation] Daily reconciliation completed');
    } catch (error) {
      console.error('[Reconciliation] Reconciliation job failed:', error);
    }
  });

  console.log('[Reconciliation] Payment reconciliation job scheduled (daily at 2 AM)');
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

