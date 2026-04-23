-- Migration: Create staff_checkin_attempts table for auto check-in logging
-- Idempotent: safe to run multiple times (table created only if not exists)
-- Created for automatic GPS check-in on login

CREATE TABLE IF NOT EXISTS staff_checkin_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_ic VARCHAR(20) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    distance_from_masjid DECIMAL(10, 2) NULL,
    result ENUM('outside_location', 'gps_unavailable', 'already_checked_in', 'error') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_ic (staff_ic),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_result (result)
);
