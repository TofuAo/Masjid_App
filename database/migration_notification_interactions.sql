-- =====================================
-- NOTIFICATION INTERACTIONS TABLE
-- Tracks which users have read/dismissed state-based notifications
-- =====================================
CREATE TABLE IF NOT EXISTS notification_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    notification_id VARCHAR(120) NOT NULL COMMENT 'e.g. PENDING_APPROVAL-{ic}, FAILED_PAYMENT-{id}, RESULTS_READY-{id}',
    action ENUM('read', 'dismissed') DEFAULT 'read',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_notification (user_ic, notification_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_notification_id (notification_id),
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
);
