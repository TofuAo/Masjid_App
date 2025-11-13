-- =====================================
-- NOTIFICATIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'announcement', 'reminder') DEFAULT 'info',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500) NULL COMMENT 'Optional link to related page',
    related_type VARCHAR(50) NULL COMMENT 'Type of related entity (e.g., fee, attendance, result)',
    related_id INT NULL COMMENT 'ID of related entity',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_ic (user_ic),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
);

-- =====================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_ic VARCHAR(20) PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    notify_on_fee_due BOOLEAN DEFAULT TRUE,
    notify_on_attendance BOOLEAN DEFAULT TRUE,
    notify_on_result BOOLEAN DEFAULT TRUE,
    notify_on_announcement BOOLEAN DEFAULT TRUE,
    notify_on_event BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);

