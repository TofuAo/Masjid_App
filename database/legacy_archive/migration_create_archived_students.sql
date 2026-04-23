-- Migration: Create archived_students table for storing inactive students
-- This table is connected to the main student database but stores archived records separately

CREATE TABLE IF NOT EXISTS archived_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    umur INT,
    alamat VARCHAR(255),
    telefon VARCHAR(20),
    email VARCHAR(100),
    kelas_id INT,
    tarikh_daftar DATE,
    tarikh_arkib DATE DEFAULT CURRENT_TIMESTAMP,
    alasan_arkib VARCHAR(500),
    archived_by VARCHAR(20),
    original_data JSON, -- Store complete original record as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_ic (user_ic),
    INDEX idx_tarikh_arkib (tarikh_arkib),
    FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

