-- =====================================
-- EVENTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('religious', 'educational', 'social', 'charity', 'other') DEFAULT 'other',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    location VARCHAR(255),
    location_latitude DECIMAL(10, 8) NULL,
    location_longitude DECIMAL(11, 8) NULL,
    max_participants INT NULL,
    registration_required BOOLEAN DEFAULT FALSE,
    registration_deadline DATETIME NULL,
    fee DECIMAL(10, 2) DEFAULT 0,
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    image_url VARCHAR(500) NULL,
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_event_type (event_type)
);

-- =====================================
-- EVENT REGISTRATIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_ic VARCHAR(20) NOT NULL,
    status ENUM('registered', 'attended', 'cancelled', 'no_show') DEFAULT 'registered',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    payment_date DATETIME NULL,
    notes TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_ic),
    INDEX idx_event_id (event_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_status (status)
);

