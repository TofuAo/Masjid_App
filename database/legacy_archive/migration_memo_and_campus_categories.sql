-- Memo/Nota for Global Header (14-day timeline)
-- Date-range entries for Executive Setting Memo Editor

CREATE TABLE IF NOT EXISTS memo_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  content TEXT,
  created_by_ic VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dates (start_date, end_date)
);

-- Add category to campus_life_items: takwim, garis_panduan, modul, fasiliti
ALTER TABLE campus_life_items ADD COLUMN IF NOT EXISTS category VARCHAR(50) NULL;
-- For MySQL without IF NOT EXISTS:
-- Run: SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='campus_life_items' AND COLUMN_NAME='category';
-- If empty, run: ALTER TABLE campus_life_items ADD COLUMN category VARCHAR(50) NULL;
