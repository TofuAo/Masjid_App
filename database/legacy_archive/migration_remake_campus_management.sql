-- Campus Management Remake: global_events, appointments, target_role for campus_life_items
-- Run this migration to support Hari Konvo bar, Pelantikan Guru, and Tag system

-- 1. Global events for Hari Konvo date bar (5-day view)
CREATE TABLE IF NOT EXISTS global_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date)
);

-- 2. Appointments (Pelantikan Guru)
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  tarikh DATE,
  hari VARCHAR(20),
  masa VARCHAR(50),
  guru_ic VARCHAR(20),
  status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_by_ic VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tarikh (tarikh),
  INDEX idx_guru (guru_ic)
);

-- 3. Add target_role (tag) to campus_life_items for visibility (Pelajar, Guru, Pilihan)
-- Run manually if column doesn't exist: ALTER TABLE campus_life_items ADD COLUMN target_role VARCHAR(50) NULL;

-- Seed sample Hari Konvo event (optional - for demo)
-- INSERT INTO global_events (event_date, label) VALUES (CURDATE(), 'Hari Konvo');
