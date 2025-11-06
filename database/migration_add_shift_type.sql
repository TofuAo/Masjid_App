-- Migration: Add shift_type column to staff_checkin table
-- Created: 2025-01-XX

ALTER TABLE staff_checkin 
ADD COLUMN IF NOT EXISTS shift_type ENUM('normal', 'shift') DEFAULT 'normal' AFTER distance_from_masjid;

-- Add index for shift_type
CREATE INDEX IF NOT EXISTS idx_shift_type ON staff_checkin(shift_type);

