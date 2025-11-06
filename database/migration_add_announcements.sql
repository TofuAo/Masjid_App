CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_ic VARCHAR(20) NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    target_audience ENUM('all', 'students', 'teachers', 'admin') DEFAULT 'all',
    start_date DATETIME,
    end_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_ic) REFERENCES users(ic) ON DELETE CASCADE
);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);

