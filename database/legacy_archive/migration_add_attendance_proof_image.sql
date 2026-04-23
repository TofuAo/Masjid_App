-- Migration: Add proof_image column to attendance table
-- This allows teachers to upload pictures as proof of attendance

ALTER TABLE attendance 
ADD COLUMN proof_image VARCHAR(255) NULL AFTER catatan,
ADD COLUMN marked_by VARCHAR(20) NULL AFTER proof_image,
ADD INDEX idx_proof_image (proof_image),
ADD FOREIGN KEY (marked_by) REFERENCES users(ic) ON DELETE SET NULL;

