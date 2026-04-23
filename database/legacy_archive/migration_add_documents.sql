-- =====================================
-- DOCUMENTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'Size in bytes',
    file_type VARCHAR(100) NOT NULL COMMENT 'MIME type',
    category ENUM('general', 'announcement', 'result', 'fee', 'event', 'class', 'other') DEFAULT 'general',
    tags JSON NULL COMMENT 'Array of tags',
    is_public BOOLEAN DEFAULT FALSE,
    access_level ENUM('public', 'students', 'teachers', 'admin', 'custom') DEFAULT 'public',
    allowed_roles JSON NULL COMMENT 'Array of allowed roles for custom access',
    uploaded_by VARCHAR(20) NOT NULL COMMENT 'IC of uploader',
    download_count INT DEFAULT 0,
    version INT DEFAULT 1,
    parent_document_id INT NULL COMMENT 'For versioning',
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(ic) ON DELETE RESTRICT,
    FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_public (is_public)
);

-- =====================================
-- DOCUMENT ACCESS LOG TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS document_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    user_ic VARCHAR(20) NOT NULL,
    action ENUM('view', 'download', 'upload', 'update', 'delete') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_document_id (document_id),
    INDEX idx_user_ic (user_ic),
    INDEX idx_created_at (created_at)
);

