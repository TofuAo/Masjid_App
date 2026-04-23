-- Migration: Add settings table for QR code configuration and other admin settings
-- Created: 2025-11-03

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'image', 'link', 'json') DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default QR code settings
INSERT INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('qr_code_image', NULL, 'image', 'QR Code image file path or URL for payment page'),
    ('qr_code_link', NULL, 'link', 'Alternative: QR Code link/URL for payment page'),
    ('qr_code_enabled', '1', 'text', 'Enable custom QR code (1=enabled, 0=disabled, uses auto-generated QR)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

