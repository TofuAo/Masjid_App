-- Migration: Add 'pending' status to users table for registration approval queue
-- This allows new registrations to be in a pending state until approved by admin/staff

-- Modify the status ENUM to include 'pending'
ALTER TABLE users 
MODIFY COLUMN status ENUM('aktif','tidak_aktif','cuti','pending') DEFAULT 'pending';

-- Note: New registrations will default to 'pending' status
-- Existing users will remain as 'aktif' unless explicitly changed

