-- Migration: Add Payment Method Settings
-- Created: 2025-11-20
-- Allows admins to configure which payment methods are enabled

CREATE TABLE IF NOT EXISTS payment_method_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_code VARCHAR(50) UNIQUE NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    provider VARCHAR(50),
    display_order INT DEFAULT 0,
    icon VARCHAR(50),
    description TEXT,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_display_order (display_order)
);

-- Insert default payment methods
INSERT INTO payment_method_settings (method_code, method_name, enabled, provider, display_order, icon, description, config) VALUES
('fpx', 'FPX (Bank Transfer)', TRUE, 'ipay88', 1, 'CreditCard', 'Online banking transfer via FPX', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('duitnow_qr', 'DuitNow QR', TRUE, 'paynet_direct', 2, 'QrCode', 'Scan QR code to pay via DuitNow', JSON_OBJECT('providers', JSON_ARRAY('paynet_direct'))),
('duitnow_request', 'DuitNow Request', TRUE, 'paynet_direct', 3, 'Smartphone', 'Receive payment request on your phone', JSON_OBJECT('providers', JSON_ARRAY('paynet_direct'))),
('tng_ewallet', 'Touch\'n Go eWallet', TRUE, 'ipay88', 4, 'Wallet', 'Pay using Touch\'n Go eWallet', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('boost', 'Boost', TRUE, 'ipay88', 5, 'Wallet', 'Pay using Boost e-wallet', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl'))),
('grabpay', 'GrabPay', TRUE, 'ipay88', 6, 'Wallet', 'Pay using GrabPay', JSON_OBJECT('providers', JSON_ARRAY('ipay88', 'eghl')))
ON DUPLICATE KEY UPDATE method_name = VALUES(method_name);

