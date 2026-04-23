-- =====================================
-- REPORT TEMPLATES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS report_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL COMMENT 'e.g., attendance, financial, student',
    template_config JSON NOT NULL COMMENT 'Report configuration',
    created_by VARCHAR(20) NOT NULL COMMENT 'IC of creator',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_report_type (report_type)
);

-- =====================================
-- GENERATED REPORTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS generated_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    parameters JSON COMMENT 'Report parameters used',
    file_path VARCHAR(1000) COMMENT 'Path to generated file',
    file_format ENUM('pdf', 'excel', 'csv', 'json') DEFAULT 'pdf',
    file_size BIGINT,
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    generated_by VARCHAR(20) NOT NULL COMMENT 'IC of generator',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'When report expires',
    download_count INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(ic) ON DELETE RESTRICT,
    INDEX idx_report_type (report_type),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at)
);

