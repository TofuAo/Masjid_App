CREATE TABLE IF NOT EXISTS pending_pic_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_key VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(191) NULL,
    request_method VARCHAR(10) NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    metadata JSON NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(20) NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    INDEX idx_pending_pic_changes_status (status),
    INDEX idx_pending_pic_changes_actor (created_by),
    INDEX idx_pending_pic_changes_entity (entity_type, entity_id)
);

