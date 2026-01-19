-- Migration: Add IB action logs and document flags tables
-- This tracks approval history, rejection reasons, flags, and clarifications

CREATE TABLE IF NOT EXISTS ib_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(60) NOT NULL,
    user_ic VARCHAR(20) NOT NULL,
    bulan VARCHAR(20),
    tahun INT,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    document_type ENUM('fee','attendance','monthly','general') DEFAULT 'general',
    amount DECIMAL(12,2) DEFAULT NULL,
    notes TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_ib_action_logs_user_ic (user_ic),
    INDEX idx_ib_action_logs_month_year (bulan, tahun)
);

CREATE TABLE IF NOT EXISTS ib_document_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_type ENUM('fee','attendance') NOT NULL,
    payment_id INT DEFAULT NULL,
    attendance_id INT DEFAULT NULL,
    flagged_by_ic VARCHAR(20) NOT NULL,
    needs_clarification TINYINT(1) NOT NULL DEFAULT 1,
    send_back_to_pic TINYINT(1) NOT NULL DEFAULT 0,
    reason TEXT,
    notes TEXT,
    resolved TINYINT(1) NOT NULL DEFAULT 0,
    resolved_by_ic VARCHAR(20),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flagged_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_ic) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_ib_document_flags_payment (payment_id),
    INDEX idx_ib_document_flags_attendance (attendance_id)
);
