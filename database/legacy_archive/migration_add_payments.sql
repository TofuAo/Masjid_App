-- Migration: Add Payments System
-- Created: 2025-11-19
-- Supports FPX, DuitNow (QR & Request), and E-Wallets

-- =====================================
-- PAYMENTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    method ENUM('fpx', 'duitnow_qr', 'duitnow_request', 'tng_ewallet', 'boost', 'grabpay') NOT NULL,
    provider ENUM('ipay88', 'eghl', '2c2p', 'paydibs', 'paynet_direct') NOT NULL,
    provider_reference VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired') DEFAULT 'pending',
    proof_url VARCHAR(500),
    metadata JSON,
    idempotency_key VARCHAR(255) UNIQUE,
    webhook_received BOOLEAN DEFAULT FALSE,
    webhook_data JSON,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_ic (user_ic),
    INDEX idx_status (status),
    INDEX idx_provider_reference (provider_reference),
    INDEX idx_idempotency_key (idempotency_key),
    INDEX idx_created_at (created_at)
);

-- =====================================
-- PAYMENT LOGS TABLE (for audit trail)
-- =====================================
CREATE TABLE IF NOT EXISTS payment_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status_from VARCHAR(50),
    status_to VARCHAR(50),
    message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_created_at (created_at)
);

-- =====================================
-- PAYMENT RECONCILIATION TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS payment_reconciliation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    reconciliation_date DATE NOT NULL,
    provider_status VARCHAR(50),
    local_status VARCHAR(50),
    status_match BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status_match (status_match)
);

-- =====================================
-- IDEMPOTENCY KEYS TABLE (for idempotency tracking)
-- =====================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    payment_id VARCHAR(36),
    response_data JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key_hash (key_hash),
    INDEX idx_expires_at (expires_at)
);

