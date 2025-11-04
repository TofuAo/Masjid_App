-- Migration: Add password reset tokens table
-- Created: 2025-11-03

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_ic (user_ic),
    INDEX idx_expires_at (expires_at)
);

