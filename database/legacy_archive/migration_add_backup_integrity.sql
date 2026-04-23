-- Migration: Add integrity tracking columns to backup_logs

ALTER TABLE backup_logs
  ADD COLUMN file_checksum VARCHAR(128) NULL AFTER file_size,
  ADD COLUMN integrity_signature VARCHAR(128) NULL AFTER file_checksum;

