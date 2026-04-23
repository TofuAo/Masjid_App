-- Migration: Update user_roles table to include 'ib' role
-- This migration updates the ENUM to include 'ib' if it doesn't already exist

-- First, check if the table exists and update the ENUM
ALTER TABLE user_roles 
MODIFY COLUMN role ENUM('admin', 'teacher', 'student', 'pic', 'staff', 'ib') NOT NULL;

