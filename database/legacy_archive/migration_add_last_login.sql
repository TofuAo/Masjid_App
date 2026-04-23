-- Migration: Add last_login column to users table
-- This tracks when users last logged in for automatic deactivation

-- Add last_login column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL COMMENT 'Last successful login timestamp';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_last_login ON users(last_login);

-- For existing users, set last_login to updated_at if they have been active
UPDATE users 
SET last_login = updated_at 
WHERE last_login IS NULL AND status = 'aktif' AND updated_at IS NOT NULL;

