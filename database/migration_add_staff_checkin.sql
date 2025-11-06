-- Migration: Add staff check-in table and masjid location settings
-- Created: 2025-01-XX

-- Create staff_checkin table
CREATE TABLE IF NOT EXISTS staff_checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_ic VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    check_in_latitude DECIMAL(10, 8) NULL,
    check_in_longitude DECIMAL(11, 8) NULL,
    check_out_latitude DECIMAL(10, 8) NULL,
    check_out_longitude DECIMAL(11, 8) NULL,
    status ENUM('checked_in', 'checked_out') DEFAULT 'checked_in',
    distance_from_masjid DECIMAL(10, 2) NULL COMMENT 'Distance in meters',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_staff_ic (staff_ic),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_status (status)
);

-- Insert masjid location settings (default coordinates - should be updated by admin)
-- Masjid coordinates: lat = 3.807829297637092, lng = 103.32799643765418, radius = 100 meters
INSERT INTO settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('masjid_latitude', '3.807829297637092', 'text', 'Masjid latitude coordinate for geolocation check-in'),
    ('masjid_longitude', '103.32799643765418', 'text', 'Masjid longitude coordinate for geolocation check-in'),
    ('masjid_checkin_radius', '100', 'text', 'Maximum allowed distance from masjid for check-in (in meters)')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

