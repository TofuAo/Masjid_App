CREATE TABLE IF NOT EXISTS admin_action_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    operation ENUM('create', 'update', 'delete') NOT NULL,
    data JSON NOT NULL,
    metadata JSON,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    was_undone TINYINT(1) DEFAULT 0,
    undone_at TIMESTAMP NULL,
    INDEX idx_admin_snapshots_entity (entity_type, entity_id),
    INDEX idx_admin_snapshots_expires (expires_at),
    INDEX idx_admin_snapshots_created_by (created_by)
);


