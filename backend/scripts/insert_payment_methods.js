import { pool } from '../config/database.js';

const paymentMethods = [
  {
    method_code: 'fpx',
    method_name: 'FPX (Bank Transfer)',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 1,
    icon: 'CreditCard',
    description: 'Online banking transfer via FPX',
    config: { providers: ['toyyibpay'] }
  },
  {
    method_code: 'duitnow_qr',
    method_name: 'DuitNow QR',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 2,
    icon: 'QrCode',
    description: 'Scan QR code to pay via DuitNow',
    config: { providers: ['toyyibpay'] }
  },
  {
    method_code: 'duitnow_request',
    method_name: 'DuitNow Request',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 3,
    icon: 'Smartphone',
    description: 'Receive payment request on your phone',
    config: { providers: ['toyyibpay'] }
  },
  {
    method_code: 'tng_ewallet',
    method_name: 'Touch\'n Go eWallet',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 4,
    icon: 'Wallet',
    description: 'Pay using Touch\'n Go eWallet',
    config: { providers: ['toyyibpay'] }
  },
  {
    method_code: 'boost',
    method_name: 'Boost',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 5,
    icon: 'Wallet',
    description: 'Pay using Boost e-wallet',
    config: { providers: ['toyyibpay'] }
  },
  {
    method_code: 'grabpay',
    method_name: 'GrabPay',
    enabled: true,
    provider: 'toyyibpay',
    display_order: 6,
    icon: 'Wallet',
    description: 'Pay using GrabPay',
    config: { providers: ['toyyibpay'] }
  }
];

async function insertPaymentMethods() {
  try {
    console.log('Inserting default payment methods...');
    
    for (const method of paymentMethods) {
      await pool.execute(
        `INSERT INTO payment_method_settings 
         (method_code, method_name, enabled, provider, display_order, icon, description, config)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         method_name = VALUES(method_name),
         enabled = VALUES(enabled),
         provider = VALUES(provider),
         display_order = VALUES(display_order),
         icon = VALUES(icon),
         description = VALUES(description),
         config = VALUES(config)`,
        [
          method.method_code,
          method.method_name,
          method.enabled,
          method.provider,
          method.display_order,
          method.icon,
          method.description,
          JSON.stringify(method.config)
        ]
      );
      console.log(`✓ Inserted/Updated: ${method.method_name}`);
    }
    
    console.log('✅ All payment methods inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting payment methods:', error);
    process.exit(1);
  }
}

insertPaymentMethods();

