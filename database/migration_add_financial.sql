-- =====================================
-- FINANCIAL TRANSACTIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'online', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    receipt_image VARCHAR(500),
    related_type VARCHAR(50) NULL COMMENT 'Type of related entity (e.g., fee, event, donation)',
    related_id INT NULL COMMENT 'ID of related entity',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    approved_by VARCHAR(20) NULL COMMENT 'IC of approver',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_category (category),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status)
);

-- =====================================
-- BUDGETS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    budget_type ENUM('income', 'expense') NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    spent_amount DECIMAL(10, 2) DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_budget_type (budget_type),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end)
);

