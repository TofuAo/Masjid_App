-- =====================================
-- VOLUNTEERS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    skills JSON NULL COMMENT 'Array of skills',
    availability JSON NULL COMMENT 'Availability schedule',
    interests JSON NULL COMMENT 'Array of interests',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    joined_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_volunteer (user_ic),
    INDEX idx_status (status)
);

-- =====================================
-- VOLUNTEER ACTIVITIES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS volunteer_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_ic VARCHAR(20) NOT NULL,
    activity_type ENUM('event', 'maintenance', 'teaching', 'administrative', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    hours_worked DECIMAL(5, 2) DEFAULT 0,
    location VARCHAR(255),
    supervisor_ic VARCHAR(20) NULL COMMENT 'IC of supervisor',
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_volunteer_ic (volunteer_ic),
    INDEX idx_activity_date (activity_date),
    INDEX idx_status (status)
);

-- =====================================
-- VOLUNTEER RECOGNITIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS volunteer_recognitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_ic VARCHAR(20) NOT NULL,
    recognition_type ENUM('certificate', 'award', 'appreciation', 'badge') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recognition_date DATE NOT NULL,
    hours_threshold INT NULL COMMENT 'Hours required for recognition',
    certificate_url VARCHAR(500),
    awarded_by VARCHAR(20) NOT NULL COMMENT 'IC of person awarding',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_volunteer_ic (volunteer_ic),
    INDEX idx_recognition_date (recognition_date)
);

