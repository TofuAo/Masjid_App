-- Migration: Add preferences column to users table for personal settings
-- Created: 2025-11-13

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences JSON DEFAULT NULL 
AFTER status;

-- Note: Preferences will be stored as JSON with structure:
-- {
--   "theme": "light|dark|auto",
--   "language": "ms|en",
--   "fontFamily": "system|sans-serif|serif|monospace",
--   "fontSize": "small|medium|large|xlarge"
-- }

