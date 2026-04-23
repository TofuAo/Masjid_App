-- Migration: Add document confirmation fields to attendance and fees tables
-- This allows admins to confirm/verify attendance proof images and payment receipts

-- Add confirmation fields to attendance table
ALTER TABLE attendance 
ADD COLUMN document_confirmed TINYINT(1) DEFAULT 0 AFTER proof_image,
ADD COLUMN confirmed_by VARCHAR(20) NULL AFTER document_confirmed,
ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by,
ADD COLUMN confirmation_notes TEXT NULL AFTER confirmed_at,
ADD FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL;

-- Add confirmation fields to fees table
ALTER TABLE fees 
ADD COLUMN document_confirmed TINYINT(1) DEFAULT 0 AFTER resit_img,
ADD COLUMN confirmed_by VARCHAR(20) NULL AFTER document_confirmed,
ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by,
ADD COLUMN confirmation_notes TEXT NULL AFTER confirmed_at,
ADD FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_attendance_document_confirmed ON attendance(document_confirmed);
CREATE INDEX idx_fees_document_confirmed ON fees(document_confirmed);

