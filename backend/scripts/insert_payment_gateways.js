import { pool } from '../config/database.js';

const gateways = [
  {
    gateway_name: 'stripe',
    enabled: false,
    is_test_mode: true,
    credentials: {
      public_key: '',
      secret_key: '',
      webhook_secret: '',
      currency: 'MYR'
    },
    enabled_methods: ['credit_card'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'ipay88',
    enabled: false,
    is_test_mode: true,
    credentials: {
      merchant_code: '',
      merchant_key: '',
      payment_url: 'https://payment.ipay88.com.my/epayment/entry.asp'
    },
    enabled_methods: ['credit_card', 'fpx', 'ewallet'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'billplz',
    enabled: false,
    is_test_mode: true,
    credentials: {
      api_key: '',
      collection_id: '',
      x_signature_key: ''
    },
    enabled_methods: ['fpx'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'toyyibpay',
    enabled: false,
    is_test_mode: true,
    credentials: {
      secret_key: '',
      category_code: '',
      callback_url: ''
    },
    enabled_methods: ['fpx', 'credit_card'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'paypal',
    enabled: false,
    is_test_mode: true,
    credentials: {
      client_id: '',
      client_secret: '',
      mode: 'sandbox'
    },
    enabled_methods: ['credit_card', 'paypal'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'qr_payment',
    enabled: false,
    is_test_mode: true,
    credentials: {
      qr_image_url: '',
      bank_name: '',
      account_number: '',
      account_holder_name: ''
    },
    enabled_methods: ['qr_code'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  },
  {
    gateway_name: 'manual_bank_transfer',
    enabled: false,
    is_test_mode: true,
    credentials: {
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      require_proof: true
    },
    enabled_methods: ['manual_transfer'],
    redirect_urls: {
      success_url: '/payment/success',
      failed_url: '/payment/failed',
      cancel_url: '/payment/cancel'
    }
  }
];

async function insertPaymentGateways() {
  try {
    console.log('Inserting default payment gateways...');
    
    for (const gateway of gateways) {
      await pool.execute(
        `INSERT INTO payment_gateway_settings 
         (gateway_name, enabled, is_test_mode, credentials, enabled_methods, redirect_urls)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         gateway_name = VALUES(gateway_name),
         enabled = VALUES(enabled),
         is_test_mode = VALUES(is_test_mode),
         credentials = VALUES(credentials),
         enabled_methods = VALUES(enabled_methods),
         redirect_urls = VALUES(redirect_urls)`,
        [
          gateway.gateway_name,
          gateway.enabled,
          gateway.is_test_mode,
          JSON.stringify(gateway.credentials),
          JSON.stringify(gateway.enabled_methods),
          JSON.stringify(gateway.redirect_urls)
        ]
      );
      console.log(`✓ Inserted/Updated: ${gateway.gateway_name}`);
    }
    
    console.log('✅ All payment gateways inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting payment gateways:', error);
    process.exit(1);
  }
}

insertPaymentGateways();

