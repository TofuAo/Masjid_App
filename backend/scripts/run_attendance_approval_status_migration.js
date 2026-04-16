#!/usr/bin/env node
/**
 * Run: node backend/scripts/run_attendance_approval_status_migration.js
 * Or: docker-compose exec backend node scripts/run_attendance_approval_status_migration.js
 * Adds approval_status column to attendance table (sent/approved).
 */
import { pool } from '../config/database.js';

const ALTER_SQL = `ALTER TABLE attendance ADD COLUMN approval_status VARCHAR(20) DEFAULT 'sent' COMMENT 'sent=awaiting approval, approved=finalized' AFTER document_confirmed`;
const UPDATE_SQL = `UPDATE attendance SET approval_status = CASE WHEN document_confirmed = 1 THEN 'approved' ELSE 'sent' END WHERE approval_status IS NULL OR approval_status = ''`;

async function run() {
  try {
    try {
      await pool.execute(ALTER_SQL);
      console.log('✓ Added approval_status column');
    } catch (e) {
      if (e?.code === 'ER_DUP_FIELD_NAME') {
        console.log('ℹ approval_status column already exists');
      } else {
        throw e;
      }
    }

    const [result] = await pool.execute(UPDATE_SQL);
    console.log('✓ Backfilled approval_status:', result?.affectedRows ?? 0, 'rows');

    console.log('✅ Attendance approval_status migration completed');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
