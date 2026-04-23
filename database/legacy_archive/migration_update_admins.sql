-- Migration: Update admins to only 3 specific admins
-- Created: 2025-11-19
-- This migration removes all existing admins and creates only the 3 specified admins

-- Delete all existing admins
DELETE FROM users WHERE role = 'admin';

-- Insert the 3 new admins with hashed passwords
INSERT INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES
('920312065113', 'USTAZ AMIR HASIF BIN HATA', '$2a$12$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('951220065759', 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', '$2a$12$dzmNIzsRBST1EbjNDs75iOzLnWD54uKYeOscFH/eLPK6VC3g8bEve', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('941218075641', 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', '$2a$12$HSZI9YHc60OGQB53Q0e8Bu7FCjpLpqZ4WpngiMMu8ec5fQm/F4xlG', 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

