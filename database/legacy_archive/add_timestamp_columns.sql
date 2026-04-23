-- Add timestamp columns to existing tables
-- Run this script to update the database schema

-- Add timestamps to classes table
ALTER TABLE classes 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add timestamps to attendance table
ALTER TABLE attendance 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add timestamps to exams table
ALTER TABLE exams 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add timestamps to results table
ALTER TABLE results 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add timestamps to fees table
ALTER TABLE fees 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- MIGRATION: Set users.ic as PK, remove users.id
-- 1. Drop PK constraint
ALTER TABLE users DROP PRIMARY KEY;
-- 2. Drop id column
ALTER TABLE users DROP COLUMN id;
-- 3. Set ic as new PK
ALTER TABLE users ADD PRIMARY KEY (ic);
-- 4. (Optional, for MySQL) Check constraints on child tables (students, teachers, classes, etc.)
--    Foreign keys in your schema already point to ic, no changes needed if that's the case.
--    If using constraints on 'id', fix them before dropping the column.

-- IMPORTANT: Always backup data and test this on a dev/staging environment first!