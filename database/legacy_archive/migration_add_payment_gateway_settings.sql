-- Migration: Add Payment Gateway Settings
-- Created: 2025-11-20
-- Allows admins to configure which payment gateway to use and its credentials

CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(50) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    credentials JSON,
    enabled_methods JSON,
    redirect_urls JSON,
    webhook_url VARCHAR(500),
    callback_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_gateway_name (gateway_name)
);

-- Insert default gateway settings (all disabled initially)
INSERT INTO payment_gateway_settings (gateway_name, enabled, is_test_mode, credentials, enabled_methods, redirect_urls) VALUES
('stripe', FALSE, TRUE, 
 JSON_OBJECT('public_key', '', 'secret_key', '', 'webhook_secret', '', 'currency', 'MYR'),
 JSON_ARRAY('credit_card'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('ipay88', FALSE, TRUE,
 JSON_OBJECT('merchant_code', '', 'merchant_key', '', 'payment_url', 'https://payment.ipay88.com.my/epayment/entry.asp'),
 JSON_ARRAY('credit_card', 'fpx', 'ewallet'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('billplz', FALSE, TRUE,
 JSON_OBJECT('api_key', '', 'collection_id', '', 'x_signature_key', ''),
 JSON_ARRAY('fpx'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('toyyibpay', FALSE, TRUE,
 JSON_OBJECT('secret_key', '', 'category_code', '', 'callback_url', ''),
 JSON_ARRAY('fpx', 'credit_card'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('paypal', FALSE, TRUE,
 JSON_OBJECT('client_id', '', 'client_secret', '', 'mode', 'sandbox'),
 JSON_ARRAY('credit_card', 'paypal'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('qr_payment', FALSE, TRUE,
 JSON_OBJECT('qr_image_url', '', 'bank_name', '', 'account_number', '', 'account_holder_name', ''),
 JSON_ARRAY('qr_code'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
),
('manual_bank_transfer', FALSE, TRUE,
 JSON_OBJECT('bank_name', '', 'account_number', '', 'account_holder_name', '', 'require_proof', TRUE),
 JSON_ARRAY('manual_transfer'),
 JSON_OBJECT('success_url', '/payment/success', 'failed_url', '/payment/failed', 'cancel_url', '/payment/cancel')
)
ON DUPLICATE KEY UPDATE gateway_name = VALUES(gateway_name);

