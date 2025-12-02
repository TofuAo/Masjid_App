-- Migration: Add IB (Internal Auditor) role
-- This role is for payment documentation confirmation
-- Only one person can have this role

-- Step 1: Add 'ib' to role ENUM
ALTER TABLE users 
MODIFY COLUMN role ENUM('student','teacher','admin','pic','staff','ib') NOT NULL DEFAULT 'student';

-- Step 2: Create payment_confirmation table for monthly reports
CREATE TABLE IF NOT EXISTS payment_confirmations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bulan VARCHAR(20) NOT NULL, -- Month name (e.g., 'November', 'Disember')
    tahun INT NOT NULL, -- Year (e.g., 2025)
    confirmed_by_ic VARCHAR(20) NOT NULL, -- IB user IC
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_period_start DATE NOT NULL, -- Start date of confirmation period (e.g., 2025-12-05)
    confirmation_period_end DATE NOT NULL, -- End date of confirmation period (e.g., 2025-12-10)
    status ENUM('pending','confirmed','rejected') DEFAULT 'pending',
    notes TEXT, -- Optional notes from IB
    total_payments INT DEFAULT 0, -- Total number of payments in the month
    total_amount DECIMAL(10,2) DEFAULT 0.00, -- Total amount collected
    verified_payments INT DEFAULT 0, -- Number of payments verified
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (confirmed_by_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_month_year (bulan, tahun)
);

-- Step 3: Create index for faster queries
CREATE INDEX idx_payment_confirmation_period ON payment_confirmations(confirmation_period_start, confirmation_period_end);
CREATE INDEX idx_payment_confirmation_status ON payment_confirmations(status);

