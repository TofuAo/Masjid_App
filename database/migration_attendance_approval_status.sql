-- Migration: Add approval_status to attendance table
-- Maps: sent (awaiting approval) / approved (finalized)
-- Complements document_confirmed for clearer status semantics
-- Run once: docker-compose exec backend node -e "
--   const pool = require('./config/database.js').pool;
--   pool.execute(\"ALTER TABLE attendance ADD COLUMN approval_status VARCHAR(20) DEFAULT 'sent' AFTER document_confirmed\").then(() => console.log('Done')).catch(e => console.log(e.message));
-- "

-- Add column (run once; if column exists, skip this migration)
ALTER TABLE attendance 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'sent' 
COMMENT 'sent=awaiting approval, approved=finalized'
AFTER document_confirmed;

-- Backfill from document_confirmed for existing records
UPDATE attendance 
SET approval_status = CASE 
  WHEN document_confirmed = 1 THEN 'approved' 
  ELSE 'sent' 
END 
WHERE approval_status IS NULL OR approval_status = '';
